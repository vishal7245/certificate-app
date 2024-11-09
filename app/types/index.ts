export type Position = {
    x: number;
    y: number;
  };
  
  export type Placeholder = {
    id: string;
    name: string;
    position: Position;
  };
  
  export type Template = {
    id: string;
    name: string;
    imageUrl: string;
    placeholders: Placeholder[];
  };
  
  export type Certificate = {
    id: string;
    templateId: string;
    uniqueIdentifier: string;
    data: Record<string, string>;
    generatedImageUrl: string;
    createdAt: Date;
  };