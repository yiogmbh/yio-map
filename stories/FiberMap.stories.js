import { fn } from '@storybook/test';
import { YioMap } from '../src/YioMap.js';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
/** @type {import('@storybook/web-components').Meta} */
const meta = {
  title: 'YioMap',
  component: 'yio-map',
  args: {
    onchange: fn(),
  },
};

export default meta;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
/** @type {import('@storybook/web-components').StoryObj} */
export const Default = {
  args: {},
};

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
/** @type {import('@storybook/web-components').StoryObj} */
export const CenterAndZoomArguments = {
  args: {
    center: [16, 48],
    zoom: 12,
  },
};
