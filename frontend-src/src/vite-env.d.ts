declare module '*.png' {
  const src: string
  export default src
}
declare module '*.svg' {
  const src: string
  export default src
}

// m3e-shape web component
declare namespace React.JSX {
  interface IntrinsicElements {
    'm3e-shape': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      name?: string
    }, HTMLElement>
  }
}
