import { useState } from 'react';

export const useGraph = () => {
    // Placeholder hook for graph state logic
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    return { nodes, edges };
};
