import ViewportComponent from "@AppBuilderShared/components/shapediver/viewport/ViewportComponent";
import ViewportIcons from "@AppBuilderShared/components/shapediver/viewport/ViewportIcons";
import ViewportOverlayWrapper from "@AppBuilderShared/components/shapediver/viewport/ViewportOverlayWrapper";
import {useSession} from "@AppBuilderShared/hooks/shapediver/useSession";
import {useShiftClickObjectId} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/useShiftClickObjectId";
import ObjectIdPopup from "@AppBuilderShared/components/shapediver/ui/ObjectIdPopup";
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
	TextInput,
	Table,
	Button,
	Modal,
	Badge,
	ActionIcon,
	Loader,
	Alert,
	ScrollArea,
	Collapse,
	Switch,
} from "@mantine/core";
import {IconSettings, IconEye, IconDownload, IconInfoCircle, IconChevronDown, IconChevronUp} from "@tabler/icons-react";
import {SESSION_SETTINGS_MODE} from "@shapediver/viewer.session";
import { createSession } from "@shapediver/viewer.session";
import {
	Configuration,
	SessionApi,
	ExportApi,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import React, { useState, useCallback, useEffect } from "react";

export default function HomePage() {
	// Get environment variables
	const designTicket = import.meta.env.VITE_DESIGN_TICKET;
	const viewerTicket = import.meta.env.VITE_VIEWER_TICKET;
	const shapediverEndpoint = import.meta.env.VITE_SHAPEDIVER_ENDPOINT;
	const exportBackend = import.meta.env.VITE_EXPORT_BACKEND;

	// Database API endpoint
	const DATABASE_API_URL = 'https://mongo-sd-server.onrender.com';

	// State for database designs
	const [designs, setDesigns] = useState<any[]>([]);
	const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
	const [designsError, setDesignsError] = useState<string | null>(null);
	const [selectedDesign, setSelectedDesign] = useState<any>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [fullDesignData, setFullDesignData] = useState<any>(null);
	const [isDataModalOpen, setIsDataModalOpen] = useState(false);
	const [isLoadingFullData, setIsLoadingFullData] = useState(false);
	const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null); // Track which design is generating PDF

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

	// Editable text fields state
	const [designName, setDesignName] = useState('Design Name');
	const [userName, setUserName] = useState('User Name');
	const [referringUri, setReferringUri] = useState('referring uri');

	// Save design state
	const [isSavingDesign, setIsSavingDesign] = useState(false);
	const [savedJsonData, setSavedJsonData] = useState<any>(null);
	const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

	// Active tab state
	const [activeTab, setActiveTab] = useState('designer');

	// Editor state
	const [isEditorOpen, setIsEditorOpen] = useState(false);
	const [panelOrientation, setPanelOrientation] = useState('horizontal');
	const [panelLength, setPanelLength] = useState('36');

	// Shift+click object ID detection hook for design viewport
	const { showPopup, objectId, popupPosition, hidePopup } = useShiftClickObjectId('design-viewport', 'design-session');
	
	// Debug logging for shift+click functionality
	console.log('Shift+click debug state:', { showPopup, objectId, popupPosition });
	
	// Function to upload design to server
	const uploadDesignToServer = async (designData: any) => {
		try {
			console.log('Uploading design to server:', designData);
			
			const uploadResponse = await fetch(`${DATABASE_API_URL}/api/data/upload`, {
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(designData)
			});

			if (!uploadResponse.ok) {
				const errorText = await uploadResponse.text();
				throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}\n${errorText}`);
			}

			const uploadResult = await uploadResponse.json();
			console.log('Upload successful:', uploadResult);
			
			// Set the upload result to display in modal
			setSavedJsonData({
				success: true,
				message: 'Design uploaded successfully!',
				uploadResult: uploadResult,
				originalData: designData
			});
			
			setIsJsonModalOpen(true);
			console.log('Design upload completed successfully');

		} catch (error) {
			console.error('Error uploading design:', error);
			
			// Set error result to display in modal
			setSavedJsonData({
				success: false,
				message: error instanceof Error ? error.message : 'Unknown upload error',
				originalData: designData
			});
			
			setIsJsonModalOpen(true);
			throw error; // Re-throw to be caught by the main try-catch
		}
	};

	// Function to save design by retrieving moda-json output
	const saveDesign = async () => {
		if (!designSession.sessionApi) {
			alert('Design session not ready. Please wait for the session to load.');
			return;
		}

		setIsSavingDesign(true);

		try {
			console.log('Starting design save...');
			
			// Find the moda-json output
			let modaJsonOutputId = null;
			const outputs = designSession.sessionApi.outputs;
			
			for (const [outputId, outputDef] of Object.entries(outputs)) {
				if (outputDef.name === 'moda-json') {
					modaJsonOutputId = outputId;
					console.log('Found moda-json output:', outputId);
					break;
				}
			}

			if (!modaJsonOutputId) {
				throw new Error('Could not find moda-json output in design session');
			}

			// Get the current output value
			const outputData = designSession.sessionApi.outputs[modaJsonOutputId];
			console.log('Retrieved moda-json output:', outputData);

			// Check if output has content
			if (outputData && outputData.content && outputData.content.length > 0) {
				// Get the JSON data from the output
				const jsonContent = outputData.content[0];
				console.log('JSON content:', jsonContent);

				// If it's a URL, fetch the content
				if (jsonContent.href) {
					console.log('Fetching JSON from URL:', jsonContent.href);
					const response = await fetch(jsonContent.href);
					if (!response.ok) {
						throw new Error(`Failed to fetch JSON data: ${response.status}`);
					}
					const jsonData = await response.json();
					
					// Update the JSON with our text field values
					const updatedJsonData = {
						...jsonData,
						name: designName || 'Design Name',
						author: userName || 'User Name', 
						'referrer-uri': referringUri || 'referring uri'
					};
					
					// Upload to server
					await uploadDesignToServer(updatedJsonData);
				} else if (jsonContent.data) {
					// If it's direct data
					const updatedJsonData = {
						...jsonContent.data,
						name: designName || 'Design Name',
						author: userName || 'User Name',
						'referrer-uri': referringUri || 'referring uri'
					};
					
					// Upload to server
					await uploadDesignToServer(updatedJsonData);
				} else {
					throw new Error('Output content does not contain expected JSON data or URL');
				}

				setIsJsonModalOpen(true);
				console.log('Design save completed successfully');
			} else {
				throw new Error('moda-json output does not contain any content');
			}

		} catch (error) {
			console.error('Error saving design:', error);
			alert(`Error saving design: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			setIsSavingDesign(false);
		}
	};
	const fetchLatestDesigns = useCallback(async () => {
		setIsLoadingDesigns(true);
		setDesignsError(null);
		
		try {
			console.log('Fetching designs from:', `${DATABASE_API_URL}/api/data/list_latest`);
			console.log('Server may need up to 60 seconds to spin up if idle...');
			
			// Add timeout to the fetch request - 60 seconds for server spin-up
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
			
			const response = await fetch(`${DATABASE_API_URL}/api/data/list_latest`, {
				signal: controller.signal,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				}
			});
			
			clearTimeout(timeoutId);
			
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			
			const data = await response.json();
			console.log('=== API RESPONSE DEBUG ===');
			console.log('Full API response:', data);
			console.log('Response type:', typeof data);
			console.log('Is array?', Array.isArray(data));
			console.log('Length:', data?.length);
			
			if (data && data.length > 0) {
				console.log('=== FIRST DESIGN ANALYSIS ===');
				const firstDesign = data[0];
				console.log('First design object:', firstDesign);
				console.log('Available keys:', Object.keys(firstDesign));
				console.log('_id field:', firstDesign._id);
				console.log('name field:', firstDesign.name);
				console.log('author field:', firstDesign.author);
				console.log('design-width-inches field:', firstDesign['design-width-inches']);
				console.log('design-height-inches field:', firstDesign['design-height-inches']);
				console.log('uploadedAt field:', firstDesign.uploadedAt);
				console.log('selected_pattern field:', firstDesign.selected_pattern);
				console.log('selected_material field:', firstDesign.selected_material);
				console.log('panels field:', firstDesign.panels);
				console.log('moda-version field:', firstDesign['moda-version']);
			} else {
				console.log('No designs found or data is empty');
			}
			
			setDesigns(data || []);
		} catch (error) {
			console.error('Error fetching designs:', error);
			if (error instanceof Error && error.name === 'AbortError') {
				setDesignsError('Request timed out after 60 seconds. The server may be experiencing issues or taking longer than usual to respond.');
			} else {
				setDesignsError(error instanceof Error ? error.message : 'Failed to fetch designs');
			}
		} finally {
			setIsLoadingDesigns(false);
		}
	}, [DATABASE_API_URL]);

	// Fetch designs when component mounts
	useEffect(() => {
		fetchLatestDesigns();
	}, [fetchLatestDesigns]);

	// Function to handle design click
	const handleDesignClick = (design: any) => {
		setSelectedDesign(design);
		setIsModalOpen(true);
	};

	// Function to load design data into control panel
	const handleDataClick = async (design: any) => {
		setIsLoadingFullData(true);
		try {
			const designId = design._id?.$oid || design._id || design.id;
			console.log('Loading design data for ID:', designId);
			console.log('Server may need up to 60 seconds to spin up if idle...');
			
			// Add timeout to the fetch request - 60 seconds for server spin-up
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
			
			const response = await fetch(`${DATABASE_API_URL}/api/data/${designId}`, {
				signal: controller.signal,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				}
			});
			
			clearTimeout(timeoutId);
			
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			
			const fullData = await response.json();
			console.log('Loading design data into control panel:', fullData);
			
			// Update text fields
			if (fullData.name) {
				setDesignName(fullData.name);
			}
			if (fullData.author) {
				setUserName(fullData.author);
			}
			if (fullData['referrer-uri']) {
				setReferringUri(fullData['referrer-uri']);
			}
			
			// Update parameter values and regenerate model
			const newParameters = { ...parameters };
			
			if (fullData['design-width-inches'] !== undefined) {
				newParameters.width = fullData['design-width-inches'];
			}
			if (fullData['design-height-inches'] !== undefined) {
				newParameters.height = fullData['design-height-inches'];
			}
			if (fullData.selected_pattern !== undefined) {
				newParameters.select_pattern = fullData.selected_pattern.toString();
			}
			if (fullData.selected_material !== undefined) {
				newParameters.select_material = fullData.selected_material.toString();
			}
			
			// Update state
			setParameters(newParameters);
			
			// Apply parameters to both sessions
			console.log('Applying loaded parameters:', newParameters);
			
			// Use a small delay to ensure state is updated before calling updateParameter
			setTimeout(async () => {
				await updateParameter('width', newParameters.width);
				await updateParameter('height', newParameters.height);
				await updateParameter('select_pattern', newParameters.select_pattern);
				await updateParameter('select_material', newParameters.select_material);
			}, 100);
			
			// Show success notification and switch to design tab
			alert(`Design "${fullData.name || 'Unnamed Design'}" loaded successfully into control panel!`);
			setActiveTab('designer');
			
			console.log('Design loaded successfully into control panel');
			
		} catch (error) {
			console.error('Error loading design data:', error);
			if (error instanceof Error && error.name === 'AbortError') {
				alert('Request timed out after 60 seconds. The server may be experiencing issues or taking longer than usual to respond.');
			} else {
				alert(`Error loading design data: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		} finally {
			setIsLoadingFullData(false);
		}
	};

	// Function to generate and download PDF
	const generatePDF = async (design: any) => {
		const designId = design._id?.$oid || design._id || design.id;
		if (!designId) {
			alert('Invalid design ID');
			return;
		}

		setIsGeneratingPDF(designId);

		try {
			console.log('Starting PDF generation for design:', designId);
			
			// Step 1: Create SDK configuration (equivalent to Python's Configuration(endpoint))
			const config = new Configuration({
				basePath: shapediverEndpoint,
			});

			// Step 2: Create session using export backend ticket (equivalent to Python's SessionApi(client).create_session_by_ticket(ticket))
			const sessionApi = new SessionApi(config);
			const sessionResponse = await sessionApi.createSessionByTicket(exportBackend);
			
			console.log('Session response:', sessionResponse.status, sessionResponse.statusText);
			const sessionData = sessionResponse.data;
			const sessionId = sessionData.sessionId;
			console.log('Created session ID:', sessionId);

			// Immediately proceed with parameter and export finding to minimize session timeout risk
			console.log('Session data structure:', sessionData);

			// Step 3: Find the moda-json input parameter (equivalent to Python's param search)
			let modaJsonInputId = null;
			
			if (sessionData.parameters) {
				for (const [paramId, paramDef] of Object.entries(sessionData.parameters)) {
					if ((paramDef as any).name === 'moda-json') {
						modaJsonInputId = paramId;
						console.log('Found moda-json input parameter:', paramId);
						console.log('Parameter definition:', paramDef);
						console.log('Parameter type:', (paramDef as any).type);
						break;
					}
				}
			}

			if (!modaJsonInputId) {
				throw new Error('Could not find moda-json input parameter');
			}

			// Step 4: Find the PDF export (equivalent to Python's export search)
			let pdfExportId = null;
			let pdfExportName = null;
			
			if (sessionData.exports) {
				for (const [exportId, exportDef] of Object.entries(sessionData.exports)) {
					const exportData = (exportDef as any);
					if (exportData.type === 'download' && exportData.name && exportData.name.toLowerCase().includes('pdf')) {
						pdfExportId = exportId;
						pdfExportName = exportData.name;
						console.log('Found PDF export:', pdfExportName, 'with ID:', exportId);
						break;
					}
				}
			}

			if (!pdfExportId) {
				throw new Error('Could not find PDF download export');
			}

			// Step 5: Prepare the moda-json URI (equivalent to Python's new_moda_json_uri)
			const modaJsonUri = `${DATABASE_API_URL}/api/data/${designId}`;
			console.log('Using moda-json URI:', modaJsonUri);

			// Step 6: Submit export computation (equivalent to Python's ReqExport)
			const exportApi = new ExportApi(config);
			const exportRequest = {
				parameters: {
					[modaJsonInputId]: modaJsonUri
				},
				exports: [pdfExportId]
			};

			console.log('Submitting export request:', exportRequest);
			const exportResults = await exportApi.computeExports(sessionId, exportRequest);
			console.log('Export computation completed:', exportResults);

			// Step 7: Get the PDF download URL
			const exportData = exportResults.data;
			if (exportData.exports && exportData.exports[pdfExportId]) {
				const pdfResult = exportData.exports[pdfExportId] as any; // Type assertion for ResExport
				if (pdfResult.content && pdfResult.content.length > 0) {
					const pdfUrl = pdfResult.content[0].href;
					if (pdfUrl) {
						console.log('Downloading PDF from:', pdfUrl);
						
						// Create a download link (equivalent to Python's file download)
						const link = document.createElement('a');
						link.href = pdfUrl;
						link.download = `${design.name || 'design'}.pdf`;
						link.target = '_blank';
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
						
						console.log('PDF download initiated');
					} else {
						throw new Error('PDF export content does not have a download URL');
					}
				} else {
					throw new Error('PDF export did not return content');
				}
			} else {
				throw new Error('Export computation did not return expected PDF export');
			}

			// Note: Not closing session immediately to prevent timeout issues
			// The session will expire automatically on the server
			console.log('PDF generation completed successfully');

		} catch (error) {
			console.error('Error generating PDF:', error);
			alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			setIsGeneratingPDF(null);
		}
	};

	// Function to format date - handle both string and MongoDB date objects
	const formatDate = (dateValue: any) => {
		if (!dateValue) return 'Unknown';
		
		// Handle MongoDB date object format: { "$date": "2025-08-04T14:07:35.431Z" }
		if (typeof dateValue === 'object' && dateValue.$date) {
			return new Date(dateValue.$date).toLocaleString();
		}
		
		// Handle string dates
		if (typeof dateValue === 'string') {
			return new Date(dateValue).toLocaleString();
		}
		
		// Handle Date objects
		if (dateValue instanceof Date) {
			return dateValue.toLocaleString();
		}
		
		return 'Invalid date';
	};

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

			<Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'designer')} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
				<Tabs.List>
					<Tabs.Tab value="designer" leftSection={<IconSettings size={14} />}>
						Design
					</Tabs.Tab>
					<Tabs.Tab value="viewer" leftSection={<IconEye size={14} />}>
						View
					</Tabs.Tab>
					<Tabs.Tab value="exporter" leftSection={<IconDownload size={14} />}>
						Manage
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
										{/* Object ID popup for shift+click functionality */}
										<ObjectIdPopup
											visible={showPopup}
											objectId={objectId}
											position={popupPosition}
											onClose={hidePopup}
										/>
									</ViewportComponent>
								</div>
							</Grid.Col>
							<Grid.Col span={4} style={{ minHeight: 'calc(100vh - 150px)' }}>
								<Card shadow="sm" p="md" radius="md" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
									<div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minWidth: 0 }}>
										<Stack gap="lg">
											{/* Header with Editable Name Fields and Save Button */}
											<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minWidth: 0 }}>
												<div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
													<TextInput
														value={designName}
														onChange={(event) => setDesignName(event.currentTarget.value)}
														placeholder="Enter design name"
														size="md"
														fw={600}
														styles={{
															input: {
																fontWeight: 600,
																fontSize: '18px',
																border: 'none',
																backgroundColor: 'transparent',
																padding: '0',
																width: '100%',
																minWidth: 0,
															}
														}}
													/>
													<TextInput
														value={userName}
														onChange={(event) => setUserName(event.currentTarget.value)}
														placeholder="Enter user name"
														size="sm"
														c="dimmed"
														mt="xs"
														styles={{
															input: {
																color: 'var(--mantine-color-dimmed)',
																border: 'none',
																backgroundColor: 'transparent',
																padding: '0',
																width: '100%',
																minWidth: 0,
															}
														}}
													/>
												</div>
												<Button
													onClick={saveDesign}
													loading={isSavingDesign}
													variant="light"
													size="sm"
													style={{ marginLeft: '16px', flexShrink: 0 }}
												>
													Save Design
												</Button>
											</div>

											{/* Compact Controls Row */}
											<Grid>
												<Grid.Col span={4}>
													<Text size="sm" fw={500} mb="xs">Width</Text>
													<NumberInput
														value={parameters.width}
														onChange={(value) => {
															const numValue = typeof value === 'string' ? parseInt(value) || 36 : value || 36;
															setParameters(prev => ({ ...prev, width: numValue }));
															updateParameter('width', numValue);
														}}
														min={36}
														max={200}
														step={1}
														size="sm"
														placeholder="36-200"
													/>
												</Grid.Col>
												<Grid.Col span={4}>
													<Text size="sm" fw={500} mb="xs">Height</Text>
													<NumberInput
														value={parameters.height}
														onChange={(value) => {
															const numValue = typeof value === 'string' ? parseInt(value) || 36 : value || 36;
															setParameters(prev => ({ ...prev, height: numValue }));
															updateParameter('height', numValue);
														}}
														min={36}
														max={200}
														step={1}
														size="sm"
														placeholder="36-200"
													/>
												</Grid.Col>
												<Grid.Col span={4}>
													<Text size="sm" fw={500} mb="xs">Pattern</Text>
													<Select
														value={parameters.select_pattern}
														onChange={(value) => updateParameter('select_pattern', value)}
														data={patternOptions}
														placeholder="Select"
														size="sm"
													/>
												</Grid.Col>
											</Grid>

											{/* Editor Section */}
											<div>
												<div 
													style={{ 
														display: 'flex', 
														justifyContent: 'space-between', 
														alignItems: 'center', 
														cursor: 'pointer',
														padding: '8px 0',
														borderBottom: isEditorOpen ? '1px solid var(--mantine-color-gray-3)' : 'none'
													}}
													onClick={() => setIsEditorOpen(!isEditorOpen)}
												>
													<Text size="sm" fw={500}>Editor</Text>
													<ActionIcon variant="subtle" size="sm">
														{isEditorOpen ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
													</ActionIcon>
												</div>
												
												<Collapse in={isEditorOpen}>
													<Stack gap="md" pt="md">
														<Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
															Shift click to remove panels from pattern
														</Text>
														
														<div>
															<Text size="sm" fw={500} mb="xs">Panel Creation</Text>
															
															<Grid>
																<Grid.Col span={6}>
																	<Text size="xs" mb="xs">Orientation</Text>
																	<Switch
																		checked={panelOrientation === 'vertical'}
																		onChange={(event) => setPanelOrientation(event.currentTarget.checked ? 'vertical' : 'horizontal')}
																		onLabel="Vertical"
																		offLabel="Horizontal"
																		size="sm"
																	/>
																</Grid.Col>
																<Grid.Col span={6}>
																	<Text size="xs" mb="xs">Length</Text>
																	<Select
																		value={panelLength}
																		onChange={(value) => setPanelLength(value || '36')}
																		data={[
																			{ value: '36', label: '36"' },
																			{ value: '54', label: '54"' },
																			{ value: '72', label: '72"' },
																			{ value: '90', label: '90"' },
																			{ value: '108', label: '108"' }
																		]}
																		size="sm"
																		placeholder="Select length"
																	/>
																</Grid.Col>
															</Grid>
														</div>
													</Stack>
												</Collapse>
											</div>
										</Stack>
									</div>

									{/* Bottom Status Bar */}
									<div style={{ 
										display: 'flex', 
										justifyContent: 'space-between', 
										alignItems: 'flex-end',
										paddingTop: '16px',
										borderTop: '1px solid var(--mantine-color-gray-2)',
										marginTop: '16px'
									}}>
										{/* Session Status - Bottom Left */}
										<div>
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

										{/* Referring URI - Bottom Right */}
										<div style={{ textAlign: 'right', maxWidth: '200px', minWidth: 0, overflow: 'hidden' }}>
											<TextInput
												value={referringUri}
												onChange={(event) => setReferringUri(event.currentTarget.value)}
												placeholder="Enter referring URI"
												size="sm"
												styles={{
													input: {
														color: 'var(--mantine-color-dimmed)',
														border: 'none',
														backgroundColor: 'transparent',
														padding: '0',
														fontSize: '12px',
														textAlign: 'right',
														width: '100%',
														minWidth: 0,
													}
												}}
											/>
										</div>
									</div>
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
										{/* Header with Editable Name Fields and Save Button */}
										<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
											<div style={{ flex: 1 }}>
												<TextInput
													value={designName}
													onChange={(event) => setDesignName(event.currentTarget.value)}
													placeholder="Enter design name"
													size="md"
													fw={600}
													styles={{
														input: {
															fontWeight: 600,
															fontSize: '18px',
															border: 'none',
															backgroundColor: 'transparent',
															padding: '0',
														}
													}}
												/>
												<TextInput
													value={userName}
													onChange={(event) => setUserName(event.currentTarget.value)}
													placeholder="Enter user name"
													size="sm"
													c="dimmed"
													mt="xs"
													styles={{
														input: {
															color: 'var(--mantine-color-dimmed)',
															border: 'none',
															backgroundColor: 'transparent',
															padding: '0',
														}
													}}
												/>
											</div>
											<Button
												onClick={saveDesign}
												loading={isSavingDesign}
												variant="light"
												size="sm"
												style={{ marginLeft: '16px', flexShrink: 0 }}
											>
												Save Design
											</Button>
										</div>

										{/* Compact Controls Row */}
										<Grid>
											<Grid.Col span={4}>
												<Text size="sm" fw={500} mb="xs">Width</Text>
												<NumberInput
													value={parameters.width}
													onChange={(value) => {
														const numValue = typeof value === 'string' ? parseInt(value) || 36 : value || 36;
														setParameters(prev => ({ ...prev, width: numValue }));
														updateParameter('width', numValue);
													}}
													min={36}
													max={200}
													step={1}
													size="sm"
													placeholder="36-200"
												/>
											</Grid.Col>
											<Grid.Col span={4}>
												<Text size="sm" fw={500} mb="xs">Height</Text>
												<NumberInput
													value={parameters.height}
													onChange={(value) => {
														const numValue = typeof value === 'string' ? parseInt(value) || 36 : value || 36;
														setParameters(prev => ({ ...prev, height: numValue }));
														updateParameter('height', numValue);
													}}
													min={36}
													max={200}
													step={1}
													size="sm"
													placeholder="36-200"
												/>
											</Grid.Col>
											<Grid.Col span={4}>
												<Text size="sm" fw={500} mb="xs">Pattern</Text>
												<Select
													value={parameters.select_pattern}
													onChange={(value) => updateParameter('select_pattern', value)}
													data={patternOptions}
													placeholder="Select"
													size="sm"
												/>
											</Grid.Col>
										</Grid>

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

										{/* Referring URI Field */}
										<div style={{ marginTop: 'auto', paddingTop: '16px' }}>
											<TextInput
												value={referringUri}
												onChange={(event) => setReferringUri(event.currentTarget.value)}
												placeholder="Enter referring URI"
												size="sm"
												styles={{
													input: {
														color: 'var(--mantine-color-dimmed)',
														border: 'none',
														backgroundColor: 'transparent',
														padding: '0',
														fontSize: '12px',
													}
												}}
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
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<div>
								<Title order={2}>Design Database</Title>
								<Text size="md" c="dimmed">
									Browse and manage your saved designs from the database.
								</Text>
							</div>
							<div style={{ display: 'flex', gap: '8px' }}>
								<Button 
									onClick={fetchLatestDesigns} 
									loading={isLoadingDesigns}
									leftSection={<IconDownload size={16} />}
								>
									Refresh Latest
								</Button>
								<Button 
									variant="light"
									onClick={async () => {
										setIsLoadingDesigns(true);
										setDesignsError(null);
										try {
											console.log('Fetching ALL designs from:', `${DATABASE_API_URL}/api/data/list`);
											console.log('Server may need up to 60 seconds to spin up if idle...');
											
											// Add timeout to the fetch request - 60 seconds for server spin-up
											const controller = new AbortController();
											const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
											
											const response = await fetch(`${DATABASE_API_URL}/api/data/list`, {
												signal: controller.signal,
												headers: {
													'Accept': 'application/json',
													'Content-Type': 'application/json',
												}
											});
											
											clearTimeout(timeoutId);
											
											if (!response.ok) {
												throw new Error(`HTTP ${response.status}: ${response.statusText}`);
											}
											const data = await response.json();
											console.log('=== ALL DESIGNS DEBUG ===');
											console.log('All designs:', data);
											setDesigns(data || []);
										} catch (error) {
											console.error('Error fetching all designs:', error);
											if (error instanceof Error && error.name === 'AbortError') {
												setDesignsError('Request timed out after 60 seconds. The server may be experiencing issues or taking longer than usual to respond.');
											} else {
												setDesignsError(error instanceof Error ? error.message : 'Failed to fetch all designs');
											}
										} finally {
											setIsLoadingDesigns(false);
										}
									}}
									loading={isLoadingDesigns}
								>
									Load All
								</Button>
								<Button 
									variant="outline"
									onClick={() => {
										// Add some test data to verify the table is working
										const mockData = [
											{
												_id: { $oid: "test1" },
												name: "Test Design 1",
												author: "Test Author",
												totalVersions: 3,
												uploadedAt: { $date: new Date().toISOString() }
											},
											{
												_id: { $oid: "test2" },
												name: "Test Design 2", 
												author: "Another Author",
												totalVersions: 1,
												uploadedAt: { $date: new Date().toISOString() }
											}
										];
										setDesigns(mockData);
										setDesignsError(null);
									}}
								>
									Test Data
								</Button>
							</div>
						</div>

						{designsError && (
							<Alert color="red" title="Error loading designs">
								{designsError}
							</Alert>
						)}

						<Card shadow="sm" p="lg" radius="md" style={{ flex: 1, overflow: 'hidden' }}>
							{isLoadingDesigns ? (
								<div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '200px', gap: '16px' }}>
									<Loader size="lg" />
									<div style={{ textAlign: 'center' }}>
										<Text fw={500}>Loading designs from database...</Text>
										<Text size="sm" c="dimmed" mt="xs">
											Server may take up to 60 seconds to spin up if idle.
										</Text>
										<Text size="sm" c="dimmed">
											You can switch to other tabs while waiting.
										</Text>
									</div>
								</div>
							) : designs.length === 0 ? (
								<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
									<Text c="dimmed">No designs found in the database.</Text>
								</div>
							) : (
								<div style={{ height: '100%', overflow: 'auto' }}>
									<Table striped highlightOnHover>
										<Table.Thead>
											<Table.Tr>
												<Table.Th>Name</Table.Th>
												<Table.Th>Versions</Table.Th>
												<Table.Th>Last Updated</Table.Th>
												<Table.Th>Load Model</Table.Th>
												<Table.Th>Download</Table.Th>
											</Table.Tr>
										</Table.Thead>
										<Table.Tbody>
											{designs.map((design) => (
												<Table.Tr key={design._id?.$oid || design._id || design.id}>
													<Table.Td>
														<Text 
															fw={500} 
															style={{ cursor: 'pointer', color: 'var(--mantine-color-blue-6)' }}
															onClick={() => handleDesignClick(design)}
															title="Click to view design details"
														>
															{design.name || 'Unnamed Design'}
														</Text>
													</Table.Td>
													<Table.Td>
														<Text size="sm">{design.totalVersions || design.versionCount || 1}</Text>
													</Table.Td>
													<Table.Td>
														<Text size="sm">{formatDate(design.uploadedAt)}</Text>
													</Table.Td>
													<Table.Td>
														<ActionIcon 
															variant="light" 
															onClick={() => handleDataClick(design)}
															title="Load Model into Control Panel"
															loading={isLoadingFullData}
															color="blue"
														>
															<IconInfoCircle size={16} />
														</ActionIcon>
													</Table.Td>
													<Table.Td>
														<ActionIcon 
															variant="light" 
															onClick={() => generatePDF(design)}
															title="Download PDF"
															color="green"
															loading={isGeneratingPDF === (design._id?.$oid || design._id || design.id)}
															disabled={isGeneratingPDF !== null}
														>
															<IconDownload size={16} />
														</ActionIcon>
													</Table.Td>
												</Table.Tr>
											))}
										</Table.Tbody>
									</Table>
								</div>
							)}
						</Card>
					</Stack>

					{/* Design Details Modal */}
					<Modal
						opened={isModalOpen}
						onClose={() => setIsModalOpen(false)}
						title={<Text fw={600}>Design Details</Text>}
						size="lg"
					>
						{selectedDesign && (
							<Stack gap="md">
								<div>
									<Text fw={500} mb="xs">Design Information</Text>
									<Grid>
										<Grid.Col span={6}>
											<Text size="sm" c="dimmed">Name:</Text>
											<Text fw={500}>{selectedDesign.name || 'Unnamed Design'}</Text>
										</Grid.Col>
										<Grid.Col span={6}>
											<Text size="sm" c="dimmed">Author:</Text>
											<Text fw={500}>{selectedDesign.author || 'Unknown'}</Text>
										</Grid.Col>
										<Grid.Col span={6}>
											<Text size="sm" c="dimmed">Width:</Text>
											<Text fw={500}>
												{(selectedDesign['design-width-inches'] !== undefined && selectedDesign['design-width-inches'] !== null) ? 
													`${selectedDesign['design-width-inches']} inches` : 
													'Not specified'}
											</Text>
										</Grid.Col>
										<Grid.Col span={6}>
											<Text size="sm" c="dimmed">Height:</Text>
											<Text fw={500}>
												{(selectedDesign['design-height-inches'] !== undefined && selectedDesign['design-height-inches'] !== null) ? 
													`${selectedDesign['design-height-inches']} inches` : 
													'Not specified'}
											</Text>
										</Grid.Col>
										<Grid.Col span={6}>
											<Text size="sm" c="dimmed">Pattern:</Text>
											<Badge variant="light">
												{selectedDesign.selected_pattern !== undefined ? 
													`Pattern ${selectedDesign.selected_pattern}` : 'Not specified'}
											</Badge>
										</Grid.Col>
										<Grid.Col span={6}>
											<Text size="sm" c="dimmed">Material:</Text>
											<Badge variant="light" color="blue">
												{selectedDesign.selected_material !== undefined ? 
													`Material ${selectedDesign.selected_material}` : 'Not specified'}
											</Badge>
										</Grid.Col>
									</Grid>
								</div>

								<div>
									<Text fw={500} mb="xs">Metadata</Text>
									<Grid>
										<Grid.Col span={6}>
											<Text size="sm" c="dimmed">Database ID:</Text>
											<Text size="xs" style={{ fontFamily: 'monospace' }}>
												{selectedDesign._id?.$oid || selectedDesign._id || selectedDesign.id || 'Unknown'}
											</Text>
										</Grid.Col>
										<Grid.Col span={6}>
											<Text size="sm" c="dimmed">Total Versions:</Text>
											<Text fw={500}>{selectedDesign.totalVersions || selectedDesign.versionCount || 1}</Text>
										</Grid.Col>
										<Grid.Col span={6}>
											<Text size="sm" c="dimmed">Last Updated:</Text>
											<Text fw={500}>{formatDate(selectedDesign.uploadedAt)}</Text>
										</Grid.Col>
										<Grid.Col span={6}>
											<Text size="sm" c="dimmed">MODA Version:</Text>
											<Text fw={500}>{selectedDesign['moda-version'] || 'N/A'}</Text>
										</Grid.Col>
										{selectedDesign['referrer-uri'] && (
											<Grid.Col span={12}>
												<Text size="sm" c="dimmed">Referrer URI:</Text>
												<Text size="xs" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
													{selectedDesign['referrer-uri']}
												</Text>
											</Grid.Col>
										)}
									</Grid>
								</div>

								{selectedDesign.panels && selectedDesign.panels.length > 0 && (
									<div>
										<Text fw={500} mb="xs">Panels ({selectedDesign.panels.length})</Text>
										<Text size="sm" c="dimmed">
											This design contains {selectedDesign.panels.length} panel(s) with various materials and configurations.
										</Text>
									</div>
								)}

								<div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
									<Button variant="light" onClick={() => setIsModalOpen(false)}>
										Close
									</Button>
									<Button onClick={() => {
										// TODO: This will be replaced with another action later
										alert(`Design action for: ${selectedDesign.name}`);
									}}>
										Perform Action
									</Button>
								</div>
							</Stack>
						)}
					</Modal>

					{/* Full JSON Data Modal */}
					<Modal
						opened={isDataModalOpen}
						onClose={() => setIsDataModalOpen(false)}
						title={<Text fw={600}>Full JSON Data</Text>}
						size="xl"
					>
						{fullDesignData && (
							<Stack gap="md">
								<div>
									<Text fw={500} mb="xs">Complete Design Document</Text>
									<Text size="sm" c="dimmed" mb="md">
										This is the complete JSON document as stored in the MongoDB database.
									</Text>
								</div>
								
								<div style={{ 
									backgroundColor: '#f8f9fa', 
									border: '1px solid #dee2e6', 
									borderRadius: '8px', 
									padding: '16px',
									maxHeight: '400px',
									overflow: 'auto'
								}}>
									<pre style={{ 
										margin: 0, 
										fontFamily: 'Monaco, "Lucida Console", monospace', 
										fontSize: '12px',
										lineHeight: '1.4',
										whiteSpace: 'pre-wrap',
										wordBreak: 'break-word'
									}}>
										{JSON.stringify(fullDesignData, null, 2)}
									</pre>
								</div>

								<div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
									<Button 
										variant="light" 
										onClick={() => {
											navigator.clipboard.writeText(JSON.stringify(fullDesignData, null, 2));
											// You could add a notification here
										}}
									>
										Copy JSON
									</Button>
									<Button variant="light" onClick={() => setIsDataModalOpen(false)}>
										Close
									</Button>
								</div>
							</Stack>
						)}
					</Modal>

					{/* Save Design JSON Modal */}
					<Modal
						opened={isJsonModalOpen}
						onClose={() => setIsJsonModalOpen(false)}
						title={savedJsonData?.success ? "Design Upload Successful" : "Design Upload Result"}
						size="xl"
						scrollAreaComponent={ScrollArea.Autosize}
					>
						{savedJsonData && (
							<Stack gap="md">
								{savedJsonData.success ? (
									<>
										<Alert color="green" title="Success" icon="✅">
											{savedJsonData.message}
										</Alert>
										
										{savedJsonData.uploadResult && (
											<div>
												<Text fw={500} mb="xs">Upload Details:</Text>
												<div style={{ 
													backgroundColor: 'var(--mantine-color-green-0)', 
													border: '1px solid var(--mantine-color-green-3)', 
													borderRadius: '4px', 
													padding: '12px',
													maxHeight: '200px',
													overflowY: 'auto',
													fontSize: '12px',
													fontFamily: 'monospace'
												}}>
													<pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
														{JSON.stringify(savedJsonData.uploadResult, null, 2)}
													</pre>
												</div>
											</div>
										)}
									</>
								) : (
									<>
										<Alert color="red" title="Upload Failed" icon="❌">
											{savedJsonData.message}
										</Alert>
									</>
								)}

								{savedJsonData.originalData && (
									<div>
										<Text fw={500} mb="xs">Design Data {savedJsonData.success ? 'Uploaded' : 'Attempted'}:</Text>
										<div style={{ 
											backgroundColor: 'var(--mantine-color-gray-0)', 
											border: '1px solid var(--mantine-color-gray-3)', 
											borderRadius: '4px', 
											padding: '12px',
											maxHeight: '300px',
											overflowY: 'auto',
											fontSize: '12px',
											fontFamily: 'monospace'
										}}>
											<pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
												{JSON.stringify(savedJsonData.originalData, null, 2)}
											</pre>
										</div>
									</div>
								)}

								<div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
									{savedJsonData.originalData && (
										<Button 
											variant="light" 
											onClick={() => {
												navigator.clipboard.writeText(JSON.stringify(savedJsonData.originalData, null, 2));
											}}
										>
											Copy Design JSON
										</Button>
									)}
									{savedJsonData.uploadResult && (
										<Button 
											variant="light" 
											onClick={() => {
												navigator.clipboard.writeText(JSON.stringify(savedJsonData.uploadResult, null, 2));
											}}
										>
											Copy Upload Result
										</Button>
									)}
									<Button variant="light" onClick={() => setIsJsonModalOpen(false)}>
										Close
									</Button>
								</div>
							</Stack>
						)}
					</Modal>
				</Tabs.Panel>
			</Tabs>
		</Container>
	);
}
