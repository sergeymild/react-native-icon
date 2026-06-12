import React from 'react'
import { render } from '@testing-library/react-native'
import { IconView } from '../IconView'

function readProps(getByTestId: any) {
  const node = getByTestId('app-icon')
  return JSON.parse(node.props.accessibilityValue.text)
}

describe('IconView', () => {
  it('forwards icon type, tint, stroke, color, resizeMode', () => {
    const { getByTestId } = render(
      <IconView
        icon={'test-icon' as any}
        tint="#111"
        stroke="#222"
        color="#333"
        resizeMode="contain"
      />
    )
    const p = readProps(getByTestId)
    expect(p.type).toBe('test-icon')
    expect(p.tint).toBe('#111')
    expect(p.stroke).toBe('#222')
    expect(p.color).toBe('#333')
    expect(p.resizeMode).toBe('contain')
  })

  it('maps size prop into width/height', () => {
    const { getByTestId } = render(<IconView icon={'test-icon' as any} size={40} />)
    const p = readProps(getByTestId)
    expect(p.width).toBe(40)
    expect(p.height).toBe(40)
    expect(p.size).toBe(40)
  })

  it('derives width/height from contentStyle dimensions', () => {
    const { getByTestId } = render(
      <IconView icon={'test-icon' as any} contentStyle={{ width: 50, height: 60 }} />
    )
    const p = readProps(getByTestId)
    expect(p.width).toBe(50)
    expect(p.height).toBe(60)
  })

  it('wraps in a container View when containerStyle is given', () => {
    const { getByTestId } = render(
      <IconView icon={'test-icon' as any} containerStyle={{ padding: 8 }} />
    )
    // Still renders the icon inside.
    expect(getByTestId('app-icon')).toBeTruthy()
  })
})
