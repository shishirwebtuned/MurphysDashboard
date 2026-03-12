// Polyfill for findDOMNode to support react-quill with React 18
import ReactDOM from 'react-dom'

if (typeof window !== 'undefined') {
  // @ts-ignore
  if (!ReactDOM.findDOMNode) {
    // @ts-ignore
    ReactDOM.findDOMNode = (node: any) => {
      if (node == null) {
        return null
      }
      if (node.nodeType === 1) {
        return node
      }
      // For component instances, try to get the DOM node
      if (node._reactInternals) {
        return node._reactInternals.child?.stateNode || null
      }
      return null
    }
  }
}

export {}
