import type { DetailsBlock, DetailsInline } from '@/content/projectDetailsTree'
import styles from './ProjectDetailsDialog.module.scss'

function Inline({ nodes }: { nodes: DetailsInline[] }) {
  return nodes.map((node, index) => {
    switch (node.t) {
      case 'text':
        return node.v
      case 'code':
        return (
          <code key={index} className={styles.code}>
            {node.v}
          </code>
        )
      case 'strong':
        return (
          <strong key={index}>
            <Inline nodes={node.c} />
          </strong>
        )
      case 'link':
        return (
          <a key={index} className={styles.link} href={node.href} target="_blank" rel="noopener">
            <Inline nodes={node.c} />
          </a>
        )
    }
  })
}

function Block({ block }: { block: DetailsBlock }) {
  switch (block.t) {
    // The dialog's title is the h2, so the README's levels move one down
    case 'h2':
      return (
        <h3 className={styles.heading}>
          <Inline nodes={block.c} />
        </h3>
      )
    case 'h3':
      return (
        <h4 className={styles.subheading}>
          <Inline nodes={block.c} />
        </h4>
      )
    case 'p':
      return (
        <p>
          <Inline nodes={block.c} />
        </p>
      )
    case 'ul':
      return (
        <ul className={styles.list}>
          {block.items.map((item, index) => (
            <li key={index}>
              <Inline nodes={item} />
            </li>
          ))}
        </ul>
      )
    case 'table':
      return (
        <table className={styles.table}>
          <thead>
            <tr>
              {block.head.map((cell, index) => (
                <th key={index} scope="col">
                  <Inline nodes={cell} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, index) =>
                  index === 0 ? (
                    <th key={index} scope="row">
                      <Inline nodes={cell} />
                    </th>
                  ) : (
                    <td key={index}>
                      <Inline nodes={cell} />
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )
  }
}

/** The README sections as the page sets text (plan 10 §3), built from the tree, no raw HTML. */
export function DetailsText({ blocks }: { blocks: DetailsBlock[] }) {
  return blocks.map((block, index) => <Block key={index} block={block} />)
}
