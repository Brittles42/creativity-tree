"use client"

import { useCallback, useState } from "react"
import Tree from "react-d3-tree"
import { motion } from "framer-motion"

// Type definition for tree node
type TreeNode = {
  name: string;
  children?: TreeNode[];
  parent?: TreeNode | null;  // Track parent reference
}

// Recursively find ancestors of a given node
const findAncestors = (node: TreeNode | null): TreeNode[] => {
  const ancestors: TreeNode[] = []
  while (node?.parent) {
    ancestors.unshift(node.parent) // Keep ordering from top to bottom
    node = node.parent
  }
  return ancestors
}

const HeartNode = ({ nodeDatum, toggleNode, onClick }: { 
  nodeDatum: TreeNode, 
  toggleNode?: () => void, 
  onClick: (node: TreeNode) => void 
}) => {
  return (
    <motion.g whileHover={{ scale: 1.1 }} onClick={() => onClick(nodeDatum)}>
      {/* Smaller Heart Shape */}
      <path
        d="M 0 -7 
           C 3.5 -14, 14 -14, 14 -3.5 
           C 14 3.5, 7 10, 0 17 
           C -7 10, -14 3.5, -14 -3.5 
           C -14 -14, -3.5 -14, 0 -7 Z"
        fill="#FF69B4"
        stroke="#8B008B"
        strokeWidth="2"
      />

      {/* Background for text (positioned below the heart) */}
      <rect 
        x={-nodeDatum.name.length * 3.5} 
        y={20}  // Adjusted to move below the smaller heart
        width={nodeDatum.name.length * 7} 
        height={14} 
        rx={4} 
        ry={4} 
        fill="rgba(0, 0, 0, 0.7)"
      />

      {/* Text (positioned below the heart) */}
      <text 
        fill="white" 
        stroke="white"
        strokeWidth="0"
        fontSize="10px" 
        fontWeight="bold"
        x="0" 
        y="30"  // Adjusted to move below the smaller heart
        textAnchor="middle" 
      >
        {nodeDatum.name}
      </text>

      {/* Expand/Collapse Toggle (if children exist) */}
      {nodeDatum.children && (
        <motion.circle
          r={4}  // Slightly smaller toggle button
          cx="0"
          cy="-15"
          fill="#8B008B"
          onClick={(e) => {
            e.stopPropagation();
            toggleNode && toggleNode();
          }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8 }}
        />
      )}
    </motion.g>
  );
};

const Modal = ({ node, onClose }: { node: TreeNode, onClose: () => void }) => {
  if (!node) return null;

  const ancestors = findAncestors(node);

  const renderHierarchy = (node: TreeNode, level = 0) => (
    <div key={node.name} style={{ marginLeft: level * 20 }}>
      <strong>{node.name}</strong>
      {node.children && node.children.map((child) => renderHierarchy(child, level + 1))}
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-md transition-opacity duration-300">
      <div className="relative bg-white/90 backdrop-blur-lg p-6 rounded-2xl shadow-2xl w-[45em] max-w-[90%] h-[55vh] overflow-y-auto border border-gray-200">
        {/* Close (X) button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 transition-all duration-200 text-2xl"
        >
          &times;
        </button>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{node.name}</h2>

        {ancestors.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Above:</h3>
            <div className="flex flex-wrap gap-2">
              {ancestors.map((ancestor) => (
                <div
                  key={ancestor.name}
                  className="px-3 py-1 bg-neutral-300 rounded-[10px] text-sm text-gray-800"
                >
                  {ancestor.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <h3 className="text-sm font-semibold text-gray-700 mb-2">Below:</h3>
        <div className="space-y-2">{renderHierarchy(node)}</div>
      </div>
    </div>
  );
};

export default function TreeVisualization({ data }: { data: TreeNode }) {
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)

  const attachParents = (node: TreeNode, parent: TreeNode | null = null) => {
    node.parent = parent
    node.children?.forEach(child => attachParents(child, node))
  }

  attachParents(data)

  const containerRef = useCallback((containerElem: HTMLDivElement | null) => {
    if (containerElem !== null) {
      const { width, height } = containerElem.getBoundingClientRect()
      setTranslate({ x: 100, y: height / 2 })
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full min-h-[800px]">
      <Tree
        data={data}
        translate={translate}
        orientation="horizontal"
        renderCustomNodeElement={(rd3tProps) => (
          <HeartNode {...rd3tProps} onClick={setSelectedNode} />
        )}
        separation={{ siblings: 0.5, nonSiblings: 0.5 }}
        nodeSize={{ x: 200, y: 120 }}
      />
      {selectedNode && <Modal node={selectedNode} onClose={() => setSelectedNode(null)} />}
    </div>
  )
}