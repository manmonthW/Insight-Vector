
// Fix: Import d3 to resolve "Cannot find namespace 'd3'" errors for D3Node and D3Link interfaces
import * as d3 from 'd3';

export enum Stage {
  INPUT = 'INPUT',
  VECTORIZING = 'VECTORIZING',
  MAPPING = 'MAPPING',
  COMPRESSING = 'COMPRESSING',
  PRINCIPLE = 'PRINCIPLE',
  METAPHOR = 'METAPHOR'
}

export interface Vector {
  id: string;
  keyword: string;
  weight: number;
  description: string; // 深层含义解释
}

export interface InsightResult {
  vectors: Vector[];
  firstPrinciple: string;
  oldPattern: string;
  newMetaphor: string;
}

export interface ThoughtStep {
  problem: string;
  result: InsightResult;
}

export interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'center' | 'vector';
  x?: number;
  y?: number;
}

export interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | D3Node;
  target: string | D3Node;
}
