'use strict';
const {configured,runAgent,gateway}=require('../server/portfolio-agent.cjs');
// Deliberately off until model access, gateway hard budget and WAF limits are verified.
module.exports=async function(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method==='GET')return res.status(200).json({available:configured(process.env)});
  if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Method not allowed.'});}
  if(!configured(process.env))return res.status(503).json({error:'AI review is not enabled. The local workbench remains available.'});
  if(req.headers.origin!=='https://portfolio-lac-five-10.vercel.app')return res.status(403).json({error:'Unsupported origin.'});
  if(!String(req.headers['content-type']||'').startsWith('application/json'))return res.status(415).json({error:'JSON required.'});
  let body;try{body=req.body;}catch{return res.status(400).json({error:'Invalid JSON.'});}
  if(!body||typeof body.question!=='string'||!body.question.trim()||body.question.length>1500||Object.keys(body).some(k=>k!=='question'))return res.status(400).json({error:'Supply only a question of 1–1,500 characters.'});
  try{return res.status(200).json(await runAgent(body.question,gateway(process.env)));}
  catch{return res.status(502).json({error:'The AI review could not be verified. Try a narrower question or use the linked work samples.'});}
};
