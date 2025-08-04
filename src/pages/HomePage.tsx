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
} from "@mantine/core";
import {IconSettings, IconEye, IconDownload} from "@tabler/icons-react";
import {SESSION_SETTINGS_MODE} from "@shapediver/viewer.session";
import React from "react";

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

	// Debug: Log viewport container heights
	console.log("Viewport heights:", {
		windowHeight: typeof window !== 'undefined' ? window.innerHeight : 'unknown',
		calculatedHeight: typeof window !== 'undefined' ? window.innerHeight - 120 : 'unknown'
	});

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
							<Grid.Col span={10} style={{ minHeight: 'calc(100vh - 150px)' }}>
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
							<Grid.Col span={2} style={{ minHeight: 'calc(100vh - 150px)' }}>
								<Card shadow="sm" p="md" radius="md" style={{ height: '100%' }}>
									<Stack gap="sm">
										<Text fw={500}>Designer Controls</Text>
										<Text size="sm" c="dimmed">
											Session Status: {designSession.sessionApi ? "✅ Connected" : "⏳ Loading..."}
										</Text>
										{designSession.error && (
											<Text size="sm" c="red">
												❌ Error: {designSession.error.message}
											</Text>
										)}
										<Text size="xs" c="dimmed">
											Ticket: {designTicket ? "✅ Loaded" : "❌ Missing"}
										</Text>
										<Text size="xs" c="dimmed">
											Endpoint: {shapediverEndpoint || "❌ Missing"}
										</Text>
									</Stack>
								</Card>
							</Grid.Col>
						</Grid>
					</Stack>
				</Tabs.Panel>

				<Tabs.Panel value="viewer" style={{ flex: 1 }}>
					<Stack gap="md" pt="sm">
						<Grid style={{ minHeight: 'calc(100vh - 150px)' }}>
							<Grid.Col span={10} style={{ minHeight: 'calc(100vh - 150px)' }}>
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
							<Grid.Col span={2} style={{ minHeight: 'calc(100vh - 150px)' }}>
								<Card shadow="sm" p="md" radius="md" style={{ height: '100%' }}>
									<Stack gap="sm">
										<Text fw={500}>Viewer Controls</Text>
										<Text size="sm" c="dimmed">
											Session Status: {viewerSession.sessionApi ? "✅ Connected" : "⏳ Loading..."}
										</Text>
										{viewerSession.error && (
											<Text size="sm" c="red">
												❌ Error: {viewerSession.error.message}
											</Text>
										)}
										<Text size="xs" c="dimmed">
											Ticket: {viewerTicket ? "✅ Loaded" : "❌ Missing"}
										</Text>
										<Text size="xs" c="dimmed">
											Endpoint: {shapediverEndpoint || "❌ Missing"}
										</Text>
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
