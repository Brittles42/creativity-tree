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
      <motion.circle r={10} fill="#FF69B4" stroke="#8B008B" strokeWidth="2" />
      <text 
        fill="white" 
        strokeWidth="1" 
        x="0" 
        y="0" 
        textAnchor="middle" 
        dominantBaseline="middle"
      >
        {nodeDatum.name}
      </text>
      {nodeDatum.children && (
        <motion.circle
          r={5}
          cx="0"
          cy="-15"
          fill="#8B008B"
          onClick={toggleNode}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8 }}
        />
      )}
    </motion.g>
  )
}

const Modal = ({ node, onClose }: { node: TreeNode, onClose: () => void }) => {
  if (!node) return null

  const ancestors = findAncestors(node)

  const renderHierarchy = (node: TreeNode, level = 0) => (
    <div key={node.name} style={{ marginLeft: level * 20 }}>
      <strong>{node.name}</strong>
      {node.children && node.children.map((child) => renderHierarchy(child, level + 1))}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-4 rounded shadow-lg w-96 h-64 overflow-y-auto">
        <h2 className="text-lg font-bold mb-2">{node.name}</h2>
        
        {ancestors.length > 0 && (
          <>
            <h3 className="text-sm font-semibold">Above:</h3>
            <div>{ancestors.map((ancestor) => <div key={ancestor.name}>{ancestor.name}</div>)}</div>
          </>
        )}

        <h3 className="text-sm font-semibold mt-2">Below:</h3>
        <div>{renderHierarchy(node)}</div>

        <button onClick={onClose} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Close</button>
      </div>
    </div>
  )
}

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
        separation={{ siblings: 0.4, nonSiblings: 0.4 }}
        nodeSize={{ x: 200, y: 120 }}
      />
      {selectedNode && <Modal node={selectedNode} onClose={() => setSelectedNode(null)} />}
    </div>
  )
}