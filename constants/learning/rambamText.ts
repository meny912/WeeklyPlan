// Powered by OnSpace.AI
// Full Mishneh Torah text (all chapters → numbered halachot), bundled OFFLINE.
// Split into chunks so the Metro build never parses one giant module.
import C0 from './rambam/text_0';
import C1 from './rambam/text_1';
import C2 from './rambam/text_2';
import C3 from './rambam/text_3';
import C4 from './rambam/text_4';
import C5 from './rambam/text_5';
import C6 from './rambam/text_6';
import C7 from './rambam/text_7';
import C8 from './rambam/text_8';
import C9 from './rambam/text_9';
import C10 from './rambam/text_10';
import C11 from './rambam/text_11';

const RAMBAM_TEXT: Record<string, string[]> = {
  ...C0,
  ...C1,
  ...C2,
  ...C3,
  ...C4,
  ...C5,
  ...C6,
  ...C7,
  ...C8,
  ...C9,
  ...C10,
  ...C11,
};
export default RAMBAM_TEXT;
