import RootComponent from "./shared/components/RootComponent";
import AppBuilderAttributeVisualizationWidgetComponent from "./shared/components/shapediver/appbuilder/widgets/AppBuilderAttributeVisualizationWidgetComponent";
import ParameterDraggingComponent from "./shared/components/shapediver/parameter/ParameterDraggingComponent";
import ParameterDrawingComponent from "./shared/components/shapediver/parameter/ParameterDrawingComponent";
import ParameterGumballComponent from "./shared/components/shapediver/parameter/ParameterGumballComponent";
import ParameterSelectionComponent from "./shared/components/shapediver/parameter/ParameterSelectionComponent";
import ViewportComponent from "./shared/components/shapediver/viewport/ViewportComponent";
import ViewportIcons from "./shared/components/shapediver/viewport/ViewportIcons";
import ViewportOverlayWrapper from "./shared/components/shapediver/viewport/ViewportOverlayWrapper";
import {IComponentContext} from "./shared/types/context/componentcontext";
import {isAttributeVisualizationWidget} from "./shared/types/shapediver/appbuilder";
import {PARAMETER_TYPE} from "@shapediver/viewer.session";
import "~/instruments/sentry";
import React from "react";
import ReactDOM from "react-dom/client";
import AppBuilderBase from "~/AppBuilderBase";
import {PlausibleTracker} from "~/instruments/plausible";
import {setupWebVitalsTracking} from "~/instruments/webvitals";
import {SentryErrorReportingContext} from "~/instruments/sentry";

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);

const components: IComponentContext = {
	viewportComponent: {component: ViewportComponent},
	viewportOverlayWrapper: {component: ViewportOverlayWrapper},
	viewportIcons: {component: ViewportIcons},
	parameters: {
		[PARAMETER_TYPE.DRAWING]: {
			component: ParameterDrawingComponent,
			extraBottomPadding: true,
		},
		[PARAMETER_TYPE.INTERACTION]: {
			selection: {
				component: ParameterSelectionComponent,
				extraBottomPadding: true,
			},
			gumball: {
				component: ParameterGumballComponent,
				extraBottomPadding: true,
			},
			dragging: {
				component: ParameterDraggingComponent,
				extraBottomPadding: false,
			},
		},
	},
	widgets: {
		attributeVisualization: {
			isComponent: isAttributeVisualizationWidget,
			component: AppBuilderAttributeVisualizationWidgetComponent,
		},
	},
};

root.render(
	<RootComponent
		useStrictMode={false}
		tracker={PlausibleTracker}
		errorReporting={SentryErrorReportingContext}
		componentContext={components}
	>
		<AppBuilderBase />
	</RootComponent>,
);

PlausibleTracker.trackPageview();
setupWebVitalsTracking(PlausibleTracker);
