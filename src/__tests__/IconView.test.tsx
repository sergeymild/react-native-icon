import React from 'react'
import { render } from '@testing-library/react-native'
import { IconView } from '../IconView'

function readProps(getByTestId: any) {
  const node = getByTestId('app-icon')
  return JSON.parse(node.props.accessibilityValue.text)
}

describe('IconView', () => {
  it('forwards icon type, tint, stroke, color, resizeMode, testID', () => {
    const { getByTestId } = render(
      <IconView
        icon={'test-icon' as any}
        tint="#111"
        stroke="#222"
        color="#333"
        resizeMode="contain"
        testID="my-icon"
      />
    )
    const p = readProps(getByTestId)
    expect(p.type).toBe('test-icon')
    expect(p.tint).toBe('#111')
    expect(p.stroke).toBe('#222')
    expect(p.color).toBe('#333')
    expect(p.resizeMode).toBe('contain')
    expect(p.testID).toBe('my-icon')
  })

  it('maps size prop into a square width/height', () => {
    const { getByTestId } = render(<IconView icon={'test-icon' as any} size={40} />)
    const p = readProps(getByTestId)
    expect(p.width).toBe(40)
    expect(p.height).toBe(40)
  })

  it('width only → height keeps the icon aspect ratio (intrinsic 40x20)', () => {
    const { getByTestId } = render(<IconView icon={'test-icon' as any} width={100} />)
    const p = readProps(getByTestId)
    // height = 100 * (20/40) = 50
    expect(p.width).toBe(100)
    expect(p.height).toBe(50)
  })

  it('height only → width keeps the icon aspect ratio (intrinsic 40x20)', () => {
    const { getByTestId } = render(<IconView icon={'test-icon' as any} height={50} />)
    const p = readProps(getByTestId)
    // width = 50 * (40/20) = 100
    expect(p.width).toBe(100)
    expect(p.height).toBe(50)
  })

  it('both width and height are used as given (no aspect adjustment)', () => {
    const { getByTestId } = render(
      <IconView icon={'test-icon' as any} width={70} height={70} />
    )
    const p = readProps(getByTestId)
    expect(p.width).toBe(70)
    expect(p.height).toBe(70)
  })

  it('falls back to intrinsic size when nothing is given', () => {
    const { getByTestId } = render(<IconView icon={'test-icon' as any} />)
    const p = readProps(getByTestId)
    expect(p.width).toBe(40)
    expect(p.height).toBe(20)
  })

  it('derives width/height from contentStyle dimensions', () => {
    const { getByTestId } = render(
      <IconView icon={'test-icon' as any} contentStyle={{ width: 50, height: 60 }} />
    )
    const p = readProps(getByTestId)
    expect(p.width).toBe(50)
    expect(p.height).toBe(60)
  })

  it('wraps the icon in a container View carrying containerStyle', () => {
    const { toJSON, getByTestId } = render(
      <IconView icon={'test-icon' as any} containerStyle={{ padding: 8 }} />
    )
    // Host tree root must be the wrapper View carrying containerStyle...
    const root = toJSON() as any
    expect(root.type).toBe('View')
    expect(root.props.style).toEqual({ padding: 8 })
    // ...with the icon nested inside it.
    expect(root.children[0].props.testID).toBe('app-icon')
    expect(getByTestId('app-icon')).toBeTruthy()
  })

  it('does not add a wrapper View when containerStyle is absent', () => {
    const { toJSON } = render(<IconView icon={'test-icon' as any} />)
    // Without containerStyle IconView returns the bare icon as the root (no wrapper).
    const root = toJSON() as any
    expect(root.props.testID).toBe('app-icon')
  })
})
