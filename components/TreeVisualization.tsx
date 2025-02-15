"use client"

import { useCallback, useState } from "react"
import Tree from "react-d3-tree"
import { motion } from "framer-motion"

// Custom heart-shaped node component
const HeartNode = ({ nodeDatum, toggleNode }) => {
  const heartPath = "M0,-10 C-5,-20 -20,-20 -20,-10 C-20,0 0,15 0,15 C0,15 20,0 20,-10 C20,-20 5,-20 0,-10"

  return (
    <motion.g whileHover={{ scale: 1.1 }}>
      <motion.path d={heartPath} fill="#FF69B4" stroke="#8B008B" strokeWidth="2" />
      <text fill="white" strokeWidth="1" x="0" y="15" textAnchor="middle" dominantBaseline="middle">
        {nodeDatum.name}
      </text>
      {nodeDatum.children && (
        <motion.circle
          r={5}
          cx="15"
          cy="0"
          fill="#8B008B"
          onClick={toggleNode}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8 }}
        />
      )}
    </motion.g>
  )
}

export default function TreeVisualization({ data }) {
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const containerRef = useCallback((containerElem) => {
    if (containerElem !== null) {
      const { width, height } = containerElem.getBoundingClientRect()
      setDimensions({ width, height })
      setTranslate({ x: width / 2, y: height / 4 })
    }
  }, [])

  // Custom path function to create heart-like curves
  const heartPathFunc = (linkDatum, orientation) => {
    const { source, target } = linkDatum
    const midX = (source.x + target.x) / 2
    const midY = (source.y + target.y) / 2
    const curve = 50 // Adjust this value to change the curve intensity

    return `M${source.x},${source.y}
            C${midX - curve},${midY + curve},
             ${midX + curve},${midY + curve},
             ${target.x},${target.y}`
  }

  return (
    <div ref={containerRef} style={{ width: "100%", height: "600px" }}>
      <Tree
        data={data}
        translate={translate}
        orientation="vertical"
        pathFunc={heartPathFunc}
        renderCustomNodeElement={(rd3tProps) => <HeartNode {...rd3tProps} />}
        separation={{ siblings: 2, nonSiblings: 2.5 }}
        nodeSize={{ x: 100, y: 100 }}
      />
    </div>
  )
}

