// The text chunks `config/projectDetails.ts` builds from the READMEs (plan 10 §1)
declare module 'virtual:project-details/*' {
  const blocks: import('./projectDetailsTree').DetailsBlock[]
  export default blocks
}
