import type { Root, Content, RootContent } from 'mdast'
import type { Plugin } from 'unified'

export interface SlideMetadata {
  bg?: string
  class?: string
  layout?: string
  transition?: string
  [key: string]: string | undefined
}

export interface SlideNode {
  type: 'slide'
  children: Content[]
  data?: {
    metadata?: SlideMetadata
  }
}

const COMMENT_DIRECTIVE_PATTERN = /^<!--\s*(\w+)\s*:\s*(.+?)\s*-->$/

function extractMetadata(children: RootContent[]): {
  metadata: SlideMetadata
  remaining: RootContent[]
} {
  const metadata: SlideMetadata = {}
  let startIndex = 0

  for (let i = 0; i < children.length; i++) {
    const node = children[i]
    if (node.type === 'html') {
      const match = node.value.match(COMMENT_DIRECTIVE_PATTERN)
      if (match) {
        metadata[match[1]] = match[2]
        startIndex = i + 1
        continue
      }
    }
    break
  }

  return { metadata, remaining: children.slice(startIndex) }
}

export const remarkSlides: Plugin<[], Root> = function () {
  return function (tree: Root) {
    const slides: SlideNode[] = []
    let currentChildren: RootContent[] = []

    for (const node of tree.children) {
      if (node.type === 'thematicBreak') {
        if (currentChildren.length > 0) {
          const { metadata, remaining } = extractMetadata(currentChildren)
          slides.push({
            type: 'slide',
            children: remaining as Content[],
            data: { metadata },
          })
        }
        currentChildren = []
      } else {
        currentChildren.push(node)
      }
    }

    // Last slide
    if (currentChildren.length > 0) {
      const { metadata, remaining } = extractMetadata(currentChildren)
      slides.push({
        type: 'slide',
        children: remaining as Content[],
        data: { metadata },
      })
    }

    tree.children = slides as unknown as RootContent[]
  }
}
