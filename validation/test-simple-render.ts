import { renderComponentToFile } from './playwright-renderer.js';

const testCode = `
interface ButtonProps {
  text: string;
}

const Button = ({ text }) => {
  return (
    <button className="bg-violet-600 text-white px-4 py-2 rounded-md text-sm font-medium">
      {text}
    </button>
  );
};
`;

const result = await renderComponentToFile(testCode, './reports/test-button.png', {
  width: 400,
  height: 200,
  waitTimeout: 10000
});

console.log('Success:', result.success);
console.log('Latency:', result.latency + 'ms');
if (result.error) console.log('Error:', result.error);
if (result.screenshotPath) console.log('Screenshot saved to:', result.screenshotPath);
