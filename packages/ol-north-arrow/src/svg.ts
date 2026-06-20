interface ISvgs {
  [key: string]: string;
}

const svgs: ISvgs = {
  1: `
  <svg viewBox="0 0 64 64" width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M32 24.013V19.2695L18 59.5893L32 50.1023V48.4978L20.5501 56.0316L32 24.013Z" fill="black"/>
    <path d="M32 19.2695V50.1023L46 59.5893L32 19.2695Z" fill="black"/>
    <path d="M37 4.4107V16.4107H34.8167L29.6153 8.85797H29.5277V16.4107H27V4.4107H29.2183L34.3789 11.9576H34.4839V4.4107H37Z" fill="black"/>
    </svg>
`,
  2: `
  <svg viewBox="0 0 64 64" width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M44.9527 60.3222L32.25 50.4912V18.5406L44.9527 60.3222Z" fill="white" stroke="black" stroke-width="0.5"/>
    <path d="M19.0473 60.3222L31.75 50.4912V18.5406L19.0473 60.3222Z" fill="black" stroke="black" stroke-width="0.5"/>
    <path d="M36.8091 3V14.5418H34.7091L29.7063 7.27746H29.6221V14.5418H27.1909V3H29.3245L34.288 10.2587H34.389V3H36.8091Z" fill="black"/>
    </svg>`,
  D1: `
  <svg viewBox="0 0 64 64" width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M32 24.013V19.2695L18 59.5893L32 50.1023V48.4978L20.5501 56.0316L32 24.013Z" fill="white"/>
    <path d="M32 19.2695V50.1023L46 59.5893L32 19.2695Z" fill="white"/>
    <path d="M37 4.41071V16.4107H34.8167L29.6153 8.85798H29.5277V16.4107H27V4.41071H29.2183L34.3789 11.9576H34.4839V4.41071H37Z" fill="white"/>
    </svg>
  `,
  D2: `
  <svg viewBox="0 0 64 64" width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M44.9527 60.3222L32.25 50.4912V18.5406L44.9527 60.3222Z" fill="black" stroke="white" stroke-width="0.5"/>
    <path d="M19.0473 60.3222L31.75 50.4912V18.5406L19.0473 60.3222Z" fill="white" stroke="white" stroke-width="0.5"/>
    <path d="M36.8091 3V14.5418H34.7091L29.7063 7.27746H29.6221V14.5418H27.1909V3H29.3245L34.288 10.2587H34.389V3H36.8091Z" fill="white"/>
    </svg>
  `,
};

export default svgs;
export { svgs };
