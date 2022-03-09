import { Scale, StickPlot } from './Chart';

const stick = (pos: number, min: number, max: number) => ({ pos, min, max });

describe('test scale', () => {
  test('should map range', () => {
    const scale = new Scale(0, 10, 20, 40);
    expect(scale.transform(0)).toBe(20);
    expect(scale.transform(10)).toBe(40);
    expect(scale.transform(5)).toBe(30);
  });
});
describe('Test StickPlot', () => {
  test('Should have the right min and max', () => {
    const scale = new Scale(0, 1, 2, 3);
    const plot = new StickPlot(scale, scale, {
      clear() {},
      lineTo() {},
      moveTo() {},
    } as any);
    expect(plot.getMinMax()).toMatchObject({ min: 0, max: 0 });
    plot.setRange(5, 10);
    expect(plot.getMinMax()).toMatchObject({ min: 0, max: 0 });
    plot.setData([stick(0, 1, 5), stick(5, 2, 3), stick(9, 4, 4), stick(11, 5, 7)]);
    expect(plot.getMinMax()).toMatchObject({ min: 2, max: 4 });
  });
});