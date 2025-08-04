import ViewportComponent from "@AppBuilderShared/components/shapediver/viewport/ViewportComponent";
import ViewportIcons from "@AppBuilderShared/components/shapediver/viewport/ViewportIcons";
import ViewportOverlayWrapper from "@AppBuilderShared/components/shapediver/viewport/ViewportOverlayWrapper";
import {useSession} from "@AppBuilderShared/hooks/shapediver/useSession";
import {
	Card,
	Container,
	Text,
	Stack,
	Title,
	Tabs,
	Grid,
	Slider,
	Select,
	NumberInput,
} from "@mantine/core";
import {IconSettings, IconEye, IconDownload} from "@tabler/icons-react";
import {SESSION_SETTINGS_MODE} from "@shapediver/viewer.session";
import React, { useState, useCallback } from "react";

export default function HomePage() {
	// Get environment variables
	const designTicket = import.meta.env.VITE_DESIGN_TICKET;
	const viewerTicket = import.meta.env.VITE_VIEWER_TICKET;
	const shapediverEndpoint = import.meta.env.VITE_SHAPEDIVER_ENDPOINT;

	// Debug: Log environment variables
	console.log("Environment variables:", {
		designTicket,
		viewerTicket,
		shapediverEndpoint
	});

	// Setup sessions for both viewers
	const designSession = useSession({
		id: "design-session",
		ticket: designTicket,
		modelViewUrl: shapediverEndpoint,
		registerParametersAndExports: true,
		excludeViewports: ["viewer-viewport"], // Only load into design-viewport
	});

	const viewerSession = useSession({
		id: "viewer-session", 
		ticket: viewerTicket,
		modelViewUrl: shapediverEndpoint,
		registerParametersAndExports: true,
		excludeViewports: ["design-viewport"], // Only load into viewer-viewport
	});

	// Debug: Log session states
	console.log("Sessions:", {
		designSession: designSession.sessionApi ? "loaded" : "loading",
		designError: designSession.error,
		viewerSession: viewerSession.sessionApi ? "loaded" : "loading", 
		viewerError: viewerSession.error
	});

	// Debug: Log available parameters when sessions are loaded
	React.useEffect(() => {
		if (designSession.sessionApi) {
			console.log("Design session parameters available:", Object.keys(designSession.sessionApi.parameters || {}));
			console.log("Design session parameters details:", designSession.sessionApi.parameters);
			
			// Log parameter names for easier identification
			const designParams = designSession.sessionApi.parameters || {};
			Object.entries(designParams).forEach(([id, param]) => {
				console.log(`Design param: "${param.name}" (ID: ${id})`);
			});
		}
	}, [designSession.sessionApi]);

	React.useEffect(() => {
		if (viewerSession.sessionApi) {
			console.log("Viewer session parameters available:", Object.keys(viewerSession.sessionApi.parameters || {}));
			console.log("Viewer session parameters details:", viewerSession.sessionApi.parameters);
			
			// Log parameter names for easier identification
			const viewerParams = viewerSession.sessionApi.parameters || {};
			Object.entries(viewerParams).forEach(([id, param]) => {
				console.log(`Viewer param: "${param.name}" (ID: ${id})`);
			});
		}
	}, [viewerSession.sessionApi]);

	// Debug: Log viewport container heights
	console.log("Viewport heights:", {
		windowHeight: typeof window !== 'undefined' ? window.innerHeight : 'unknown',
		calculatedHeight: typeof window !== 'undefined' ? window.innerHeight - 120 : 'unknown'
	});

	// Parameter state for controlling both models
	const [parameters, setParameters] = useState({
		width: 100,
		height: 100,
		select_material: '0',
		select_pattern: '0'
	});

	// Parameter definitions
	const parameterIds = {
		width: '8bdf55a1-fea5-4702-b2bd-93d21ebe404c',
		height: '9445d8a4-52d9-490e-a3f1-44d1e4d20702',
		select_material: '269a82fd-99a6-46e1-a2d8-8a07799d4960',
		select_pattern: '342f62ad-f704-4b42-8cdd-3a65fab17978'
	};

	// Material preview images
	const PREVIEW_MATERIALS = [
		{ id: 'metal053c', name: 'Metal 053C', url: 'https://raw.githubusercontent.com/Wzesk/z_img/6828f9477ed5f6547aa7f2527bbf62a0e798c9aa/imgs/Metal053C_1K-JPG_Color.jpg' },
		{ id: 'metal055a', name: 'Metal 055A', url: 'https://raw.githubusercontent.com/Wzesk/z_img/6828f9477ed5f6547aa7f2527bbf62a0e798c9aa/imgs/Metal055A_1K-JPG_Color.jpg' },
		{ id: 'metal058a', name: 'Metal 058A', url: 'https://raw.githubusercontent.com/Wzesk/z_img/6828f9477ed5f6547aa7f2527bbf62a0e798c9aa/imgs/Metal058A_1K-JPG_Color.jpg' },
		{ id: 'metal058c', name: 'Metal 058C', url: 'https://raw.githubusercontent.com/Wzesk/z_img/6828f9477ed5f6547aa7f2527bbf62a0e798c9aa/imgs/Metal058C_1K-JPG_Color.jpg' },
		{ id: 'metal062c', name: 'Metal 062C', url: 'https://raw.githubusercontent.com/Wzesk/z_img/6828f9477ed5f6547aa7f2527bbf62a0e798c9aa/imgs/Metal062C_1K-JPG_Color.jpg' }
	];

	// Pattern options
	const patternOptions = [
		{ value: '0', label: 'horizontal' },
		{ value: '1', label: 'vertical' },
		{ value: '2', label: 'horizontal brick' },
		{ value: '3', label: 'vertical brick' }
	];

	// Function to update parameters in both sessions
	const updateParameter = useCallback(async (paramName: string, value: any) => {
		const paramId = parameterIds[paramName as keyof typeof parameterIds];
		
		// Convert numeric values to strings for ShapeDiver API
		const apiValue = typeof value === 'number' ? value.toString() : value;
		
		// Update local state
		setParameters(prev => ({ ...prev, [paramName]: value }));
		
		console.log(`Updating parameter ${paramName} (${paramId}) with value:`, apiValue);
		
		// Update both sessions if they exist
		if (designSession.sessionApi) {
			try {
				// Check if parameter exists before trying to update
				const designParams = designSession.sessionApi.parameters;
				console.log('Design session parameter check:', paramId, designParams && designParams[paramId] ? `Found: "${designParams[paramId].name}"` : 'Not found');
				
				if (designParams && designParams[paramId]) {
					await designSession.sessionApi.customize({
						[paramId]: apiValue
					});
					console.log(`Design session updated: ${paramName} = ${apiValue}`);
				} else {
					console.warn(`Parameter ${paramName} (${paramId}) not found in design session`);
					// Show available material-related parameters
					Object.entries(designParams || {}).forEach(([id, param]) => {
						if (param.name.toLowerCase().includes('material') || param.name.toLowerCase().includes('select')) {
							console.log(`Available design param: "${param.name}" (ID: ${id})`);
						}
					});
				}
			} catch (error) {
				console.error(`Error updating design session parameter ${paramName}:`, error);
			}
		}
		
		if (viewerSession.sessionApi) {
			try {
				// Check if parameter exists before trying to update
				const viewerParams = viewerSession.sessionApi.parameters;
				console.log('Viewer session parameter check:', paramId, viewerParams && viewerParams[paramId] ? `Found: "${viewerParams[paramId].name}"` : 'Not found');
				
				if (viewerParams && viewerParams[paramId]) {
					await viewerSession.sessionApi.customize({
						[paramId]: apiValue
					});
					console.log(`Viewer session updated: ${paramName} = ${apiValue}`);
				} else {
					console.warn(`Parameter ${paramName} (${paramId}) not found in viewer session`);
					// Show available material-related parameters
					Object.entries(viewerParams || {}).forEach(([id, param]) => {
						if (param.name.toLowerCase().includes('material') || param.name.toLowerCase().includes('select')) {
							console.log(`Available viewer param: "${param.name}" (ID: ${id})`);
						}
					});
				}
			} catch (error) {
				console.error(`Error updating viewer session parameter ${paramName}:`, error);
			}
		}
	}, [designSession.sessionApi, viewerSession.sessionApi, parameterIds]);

	return (
		<Container size="100%" px="sm" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
			{/* <Title order={1} size="h3" mb="md">ShapeDiver React Example</Title> */}

			<Tabs defaultValue="designer" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
				<Tabs.List>
					<Tabs.Tab value="designer" leftSection={<IconSettings size={14} />}>
						Designer
					</Tabs.Tab>
					<Tabs.Tab value="viewer" leftSection={<IconEye size={14} />}>
						Viewer
					</Tabs.Tab>
					<Tabs.Tab value="exporter" leftSection={<IconDownload size={14} />}>
						Exporter
					</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value="designer" style={{ flex: 1 }}>
					<Stack gap="md" pt="sm">
						<Grid style={{ minHeight: 'calc(100vh - 150px)' }}>
							<Grid.Col span={8} style={{ minHeight: 'calc(100vh - 150px)' }}>
								<div style={{ height: 'calc(100vh - 150px)' }}>
									<ViewportComponent 
										id="design-viewport"
										sessionSettingsId="design-session"
										sessionSettingsMode={SESSION_SETTINGS_MODE.MANUAL}
									>
										<ViewportOverlayWrapper>
											<ViewportIcons />
										</ViewportOverlayWrapper>
									</ViewportComponent>
								</div>
							</Grid.Col>
							<Grid.Col span={4} style={{ minHeight: 'calc(100vh - 150px)' }}>
								<Card shadow="sm" p="md" radius="md" style={{ height: '100%', overflowY: 'auto' }}>
									<Stack gap="lg">
										<div>
											<Text fw={600} size="lg" mb="md">Model Controls</Text>
											<Text size="sm" c="dimmed" mb="lg">
												These controls affect both the Designer and Viewer models
											</Text>
										</div>

										{/* Width Control */}
										<div>
											<Text size="sm" fw={500} mb="xs">Width: {parameters.width}</Text>
											<Slider
												value={parameters.width}
												onChange={(value) => setParameters(prev => ({ ...prev, width: value }))}
												onChangeEnd={(value) => updateParameter('width', value)}
												min={36}
												max={200}
												step={1}
												marks={[
													{ value: 36, label: '36' },
													{ value: 118, label: '118' },
													{ value: 200, label: '200' }
												]}
											/>
										</div>

										{/* Height Control */}
										<div>
											<Text size="sm" fw={500} mb="xs">Height: {parameters.height}</Text>
											<Slider
												value={parameters.height}
												onChange={(value) => setParameters(prev => ({ ...prev, height: value }))}
												onChangeEnd={(value) => updateParameter('height', value)}
												min={36}
												max={200}
												step={1}
												marks={[
													{ value: 36, label: '36' },
													{ value: 118, label: '118' },
													{ value: 200, label: '200' }
												]}
											/>
										</div>

										{/* Material Selection */}
										<div>
											<Text size="sm" fw={500} mb="xs">Material</Text>
											<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
												{PREVIEW_MATERIALS.map((material, index) => (
													<div
														key={material.id}
														onClick={() => updateParameter('select_material', index.toString())}
														style={{
															cursor: 'pointer',
															border: parameters.select_material === index.toString() ? '3px solid #228be6' : '2px solid #dee2e6',
															borderRadius: '8px',
															overflow: 'hidden',
															aspectRatio: '1',
															position: 'relative'
														}}
													>
														<img
															src={material.url}
															alt={material.name}
															style={{
																width: '100%',
																height: '100%',
																objectFit: 'cover',
																display: 'block'
															}}
														/>
														<div style={{
															position: 'absolute',
															bottom: 0,
															left: 0,
															right: 0,
															background: 'rgba(0, 0, 0, 0.7)',
															color: 'white',
															padding: '4px',
															fontSize: '10px',
															textAlign: 'center'
														}}>
															{material.name}
														</div>
													</div>
												))}
											</div>
										</div>

										{/* Pattern Selection */}
										<div>
											<Text size="sm" fw={500} mb="xs">Pattern</Text>
											<Select
												value={parameters.select_pattern}
												onChange={(value) => updateParameter('select_pattern', value)}
												data={patternOptions}
												placeholder="Select pattern"
											/>
										</div>

										{/* Session Status */}
										<div style={{ marginTop: 'auto' }}>
											<Text size="xs" fw={500} mb="xs">Session Status</Text>
											<Text size="xs" c="dimmed">
												Designer: {designSession.sessionApi ? "✅ Connected" : "⏳ Loading..."}
											</Text>
											<Text size="xs" c="dimmed">
												Viewer: {viewerSession.sessionApi ? "✅ Connected" : "⏳ Loading..."}
											</Text>
											{(designSession.error || viewerSession.error) && (
												<Text size="xs" c="red" mt="xs">
													❌ {designSession.error?.message || viewerSession.error?.message}
												</Text>
											)}
										</div>
									</Stack>
								</Card>
							</Grid.Col>
						</Grid>
					</Stack>
				</Tabs.Panel>

				<Tabs.Panel value="viewer" style={{ flex: 1 }}>
					<Stack gap="md" pt="sm">
						<Grid style={{ minHeight: 'calc(100vh - 150px)' }}>
							<Grid.Col span={8} style={{ minHeight: 'calc(100vh - 150px)' }}>
								<div style={{ height: 'calc(100vh - 150px)' }}>
									<ViewportComponent 
										id="viewer-viewport"
										sessionSettingsId="viewer-session"
										sessionSettingsMode={SESSION_SETTINGS_MODE.MANUAL}
									>
										<ViewportOverlayWrapper>
											<ViewportIcons />
										</ViewportOverlayWrapper>
									</ViewportComponent>
								</div>
							</Grid.Col>
							<Grid.Col span={4} style={{ minHeight: 'calc(100vh - 150px)' }}>
								<Card shadow="sm" p="md" radius="md" style={{ height: '100%', overflowY: 'auto' }}>
									<Stack gap="lg">
										<div>
											<Text fw={600} size="lg" mb="md">Model Controls</Text>
											<Text size="sm" c="dimmed" mb="lg">
												These controls affect both the Designer and Viewer models
											</Text>
										</div>

										{/* Width Control */}
										<div>
											<Text size="sm" fw={500} mb="xs">Width: {parameters.width}</Text>
											<Slider
												value={parameters.width}
												onChange={(value) => setParameters(prev => ({ ...prev, width: value }))}
												onChangeEnd={(value) => updateParameter('width', value)}
												min={36}
												max={200}
												step={1}
												marks={[
													{ value: 36, label: '36' },
													{ value: 118, label: '118' },
													{ value: 200, label: '200' }
												]}
											/>
										</div>

										{/* Height Control */}
										<div>
											<Text size="sm" fw={500} mb="xs">Height: {parameters.height}</Text>
											<Slider
												value={parameters.height}
												onChange={(value) => setParameters(prev => ({ ...prev, height: value }))}
												onChangeEnd={(value) => updateParameter('height', value)}
												min={36}
												max={200}
												step={1}
												marks={[
													{ value: 36, label: '36' },
													{ value: 118, label: '118' },
													{ value: 200, label: '200' }
												]}
											/>
										</div>

										{/* Material Selection */}
										<div>
											<Text size="sm" fw={500} mb="xs">Material</Text>
											<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
												{PREVIEW_MATERIALS.map((material, index) => (
													<div
														key={material.id}
														onClick={() => updateParameter('select_material', index.toString())}
														style={{
															cursor: 'pointer',
															border: parameters.select_material === index.toString() ? '3px solid #228be6' : '2px solid #dee2e6',
															borderRadius: '8px',
															overflow: 'hidden',
															aspectRatio: '1',
															position: 'relative'
														}}
													>
														<img
															src={material.url}
															alt={material.name}
															style={{
																width: '100%',
																height: '100%',
																objectFit: 'cover',
																display: 'block'
															}}
														/>
														<div style={{
															position: 'absolute',
															bottom: 0,
															left: 0,
															right: 0,
															background: 'rgba(0, 0, 0, 0.7)',
															color: 'white',
															padding: '4px',
															fontSize: '10px',
															textAlign: 'center'
														}}>
															{material.name}
														</div>
													</div>
												))}
											</div>
										</div>

										{/* Pattern Selection */}
										<div>
											<Text size="sm" fw={500} mb="xs">Pattern</Text>
											<Select
												value={parameters.select_pattern}
												onChange={(value) => updateParameter('select_pattern', value)}
												data={patternOptions}
												placeholder="Select pattern"
											/>
										</div>

										{/* Session Status */}
										<div style={{ marginTop: 'auto' }}>
											<Text size="xs" fw={500} mb="xs">Session Status</Text>
											<Text size="xs" c="dimmed">
												Designer: {designSession.sessionApi ? "✅ Connected" : "⏳ Loading..."}
											</Text>
											<Text size="xs" c="dimmed">
												Viewer: {viewerSession.sessionApi ? "✅ Connected" : "⏳ Loading..."}
											</Text>
											{(designSession.error || viewerSession.error) && (
												<Text size="xs" c="red" mt="xs">
													❌ {designSession.error?.message || viewerSession.error?.message}
												</Text>
											)}
										</div>
									</Stack>
								</Card>
							</Grid.Col>
						</Grid>
					</Stack>
				</Tabs.Panel>

				<Tabs.Panel value="exporter" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
					<Stack gap="md" pt="sm" style={{ flex: 1 }}>
						<Title order={2}>Export & Download</Title>
						<Text size="md" c="dimmed">
							Export your 3D models in various formats.
						</Text>
						<Card shadow="sm" p="lg" radius="md" style={{ flex: 1 }}>
							<Text>
								The Exporter tab will contain options for exporting and downloading 
								3D models in different formats such as STL, OBJ, 3DM, and more. 
								Configure export settings and quality options.
							</Text>
						</Card>
					</Stack>
				</Tabs.Panel>
			</Tabs>
		</Container>
	);
}
