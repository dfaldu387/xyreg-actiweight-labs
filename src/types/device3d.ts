
export interface Device3DModel {
  url: string;
  name: string;
  format: string;
}

export interface Device3DViewerProps {
  models: Device3DModel[];
  selectedModelIndex?: number;
  onModelSelect?: (index: number) => void;
}

export interface Device3DModelUploadProps {
  models: Device3DModel[];
  onModelsChange: (models: Device3DModel[]) => void;
  disabled?: boolean;
}
