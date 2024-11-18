// types/index.ts
export type Position = {
    x: number;
    y: number;
  };
  

// Test
export interface PlaceholderStyle {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
  customFontUrl?: string; 
}
  
export interface Placeholder {
  id: string;
  name: string;
  position: { x: number; y: number };
  style: PlaceholderStyle;
}

export interface SignatureStyle {
  Height: number;
  Width: number;
}

export interface Signature {
  id: string;
  name: string;
  position: { x: number; y: number };
  style: SignatureStyle;
  imageUrl: string;
}
  
export type Template = {
  id: string;
  name: string;
  imageUrl: string;
  width: number; 
  height: number; 
  placeholders: Placeholder[];
  signatures: Signature[]; 
};

  
export type Certificate = {
  id: string;
  templateId: string;
  uniqueIdentifier: string;
  data: Record<string, string>;
  generatedImageUrl: string;
  createdAt: Date;
};