export const gameSearchKey=(value:string)=>value.normalize('NFKC').replace(/[‘’]/g,"'").toLowerCase().trim()
