// types/index.ts
export type Position = {
    x: number;
    y: number;
  };
  
  export interface PlaceholderStyle {
    fontFamily: string;
    fontSize: number;
    fontColor: string;
    fontWeight: string;
    textAlign: 'left' | 'center' | 'right';
  }
  
  export interface Placeholder {
    id: string;
    name: string;
    position: { x: number; y: number };
    style: PlaceholderStyle;
  }
  
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