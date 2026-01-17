
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Vector, D3Node, D3Link, InsightResult } from '../types';

interface Props {
  vectors: Vector[];
  centerLabel: string;
  isCompressing: boolean;
  onCompressed?: () => void;
  onNodeClick?: (nodeId: string) => void;
  canDrillDown?: boolean;
  forest?: {
    path: string[];
    insightCache: Record<string, InsightResult>;
  };
}

const Visualizer: React.FC<Props> = ({ 
  vectors, 
  centerLabel, 
  isCompressing, 
  onCompressed, 
  onNodeClick,
  canDrillDown = true,
  forest
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const mainGroup = svg.append('g').attr('class', 'main-container');

    // Starry background
    const starsCount = 100;
    const starsGroup = mainGroup.append('g').attr('class', 'stars-layer');
    for (let i = 0; i < starsCount; i++) {
      starsGroup.append('circle')
        .attr('cx', (Math.random() - 0.5) * width * 3 + width / 2)
        .attr('cy', (Math.random() - 0.5) * height * 3 + height / 2)
        .attr('r', Math.random() * 1.5)
        .attr('fill', '#fff')
        .attr('opacity', Math.random() * 0.4)
        .attr('class', 'animate-pulse');
    }

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        mainGroup.attr('transform', event.transform);
      });

    svg.call(zoom);

    const nodes: D3Node[] = [
      { id: 'center', label: centerLabel, type: 'center' },
      ...vectors.map(v => ({ id: v.id, label: v.keyword, type: 'vector' as const }))
    ];

    const links: D3Link[] = vectors.map(v => ({
      source: 'center',
      target: v.id
    }));

    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3.5').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const simulation = d3.forceSimulation<D3Node>(nodes)
      .force('link', d3.forceLink<D3Node, D3Link>(links).id(d => d.id).distance(isCompressing ? 10 : 220))
      .force('charge', d3.forceManyBody().strength(isCompressing ? -5 : -800))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(80))
      .on('tick', () => {
        link
          .attr('x1', d => (d.source as D3Node).x!)
          .attr('y1', d => (d.source as D3Node).y!)
          .attr('x2', d => (d.target as D3Node).x!)
          .attr('y2', d => (d.target as D3Node).y!);
        node.attr('transform', d => `translate(${d.x},${d.y})`);
      });

    const linkGroup = mainGroup.append('g').attr('class', 'links-layer');
    const nodeGroup = mainGroup.append('g').attr('class', 'nodes-layer');

    const link = linkGroup
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#10b981')
      .attr('stroke-opacity', 0.2)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,2');

    const node = nodeGroup
      .selectAll('.node')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node group')
      .style('cursor', d => d.type === 'vector' && canDrillDown ? 'pointer' : 'grab')
      .on('click', (event, d) => {
        if (d.type === 'vector' && onNodeClick && canDrillDown) {
          onNodeClick(d.id);
        }
      })
      .call(d3.drag<SVGGElement, D3Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        })
      );

    node.append('circle')
      .attr('r', d => d.type === 'center' ? 22 : 12)
      .attr('fill', d => {
        if (d.type === 'center') return '#10b981';
        // Highlight nodes that have already been explored in the forest
        if (forest?.insightCache[d.label]) return '#10b981';
        return '#064e3b';
      })
      .attr('fill-opacity', d => {
        if (d.type === 'center') return 0.8;
        if (forest?.insightCache[d.label]) return 0.6;
        return 0.4;
      })
      .attr('stroke', d => {
        if (d.type === 'center') return '#6ee7b7';
        if (forest?.insightCache[d.label]) return '#10b981';
        return '#064e3b';
      })
      .attr('stroke-width', d => forest?.insightCache[d.label] ? 3 : 2)
      .attr('class', d => d.type === 'vector' && canDrillDown ? 'hover:fill-emerald-400 hover:stroke-emerald-200 transition-all duration-300' : '')
      .style('filter', 'url(#glow)');

    // Text label
    node.append('text')
      .text(d => d.label)
      .attr('dy', d => d.type === 'center' ? 50 : 40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f1f5f9')
      .attr('font-size', d => d.type === 'center' ? '18px' : '13px')
      .attr('font-weight', d => d.type === 'center' ? 'bold' : '500')
      .attr('class', 'tracking-wider pointer-events-none drop-shadow-lg select-none');

    // Status indicator for explored nodes
    node.filter(d => d.type === 'vector' && forest?.insightCache[d.label] !== undefined)
      .append('circle')
      .attr('r', 3)
      .attr('cy', -25)
      .attr('fill', '#10b981')
      .attr('class', 'animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]');

    if (canDrillDown) {
       node.filter(d => d.type === 'vector')
        .append('text')
        .text(d => forest?.insightCache[d.label] ? '已解构' : '○ 钻取')
        .attr('dy', 55)
        .attr('text-anchor', 'middle')
        .attr('fill', d => forest?.insightCache[d.label] ? '#34d399' : '#10b981')
        .attr('font-size', '9px')
        .attr('class', 'opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter font-bold');
    }

    if (isCompressing) {
      simulation.force('link', d3.forceLink<D3Node, D3Link>(links).id(d => d.id).distance(0));
      simulation.force('charge', d3.forceManyBody().strength(-2));
      simulation.alpha(0.5).restart();
      const timer = setTimeout(() => { if (onCompressed) onCompressed(); }, 2500);
      return () => clearTimeout(timer);
    }

    return () => { simulation.stop(); };
  }, [vectors, isCompressing, centerLabel, onCompressed, onNodeClick, canDrillDown, forest]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950/40 cursor-move">
      <svg ref={svgRef} className="w-full h-full touch-none" />
      <div className="absolute inset-0 pointer-events-none border border-emerald-500/10"></div>
    </div>
  );
};

export default Visualizer;
