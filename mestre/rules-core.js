globalThis.OP_RULE_FORMULAS={
  "version": 1,
  "sources": {
    "pp": "LJ tabelas dos estilos e p. 98",
    "warriorCR": "LJ p. 36; níveis 1–20",
    "robustHP": "LJ p. 36"
  },
  "formulas": {
    "pp": [
      "max",
      0,
      [
        "add",
        [
          "mul",
          2,
          "level"
        ],
        "bonus"
      ]
    ],
    "warriorCR": [
      "add",
      10,
      [
        "max",
        1,
        "primary"
      ],
      [
        "min",
        "con",
        [
          "max",
          1,
          [
            "floor",
            [
              "div",
              "level",
              2
            ]
          ]
        ]
      ]
    ],
    "robustHP": [
      "mul",
      3,
      "level"
    ]
  }
}
;
/* Fonte compartilhada; cópias no portal/Foundry são geradas. */
(function(root){'use strict';
 const VERSION='2026.10.26.1';
 const level=n=>Math.max(1,Math.min(20,Math.floor(Number(n)||1)));
 const formulas=root.OP_RULE_FORMULAS||(typeof module!=='undefined'&&module.exports?require('./formulas.json'):null);
 function evaluate(expr,values){if(typeof expr==='number')return expr;if(typeof expr==='string'){if(!Number.isFinite(values[expr]))throw Error('Variável inválida: '+expr);return values[expr];}const [op,...args]=expr,v=args.map(x=>evaluate(x,values));switch(op){case 'add':return v.reduce((a,b)=>a+b,0);case 'mul':return v.reduce((a,b)=>a*b,1);case 'min':return Math.min(...v);case 'max':return Math.max(...v);case 'floor':return Math.floor(v[0]);case 'div':return v[0]/v[1];default:throw Error('Operação inválida.');}}
 const formula=(name,values)=>evaluate(formulas.formulas[name],values);
 const pp=(n,bonus=0)=>formula('pp',{level:Math.max(1,Math.min(30,Math.floor(Number(n)||1))),bonus:Number(bonus)});
 const warriorCR=(n,primary,con)=>formula('warriorCR',{level:level(n),primary,con});
 const robustHP=n=>formula('robustHP',{level:level(n)});
 const conHP=(mod,policy)=>['minimo','minimum_one'].includes(policy)?Math.max(1,mod):mod;
 function diePools(dice,spent={},legacy=0){const total={},used={};for(const d of dice)total[d.faces]=(total[d.faces]||0)+d.quantidade;
 const faces=Object.keys(total).sort((a,b)=>b-a);for(const f of faces)used[f]=Math.max(0,Math.min(total[f],Math.floor(Number(spent[f])||0)));
 let missing=Math.max(0,legacy-Object.values(used).reduce((a,b)=>a+b,0));for(const f of faces){const n=Math.min(missing,total[f]-used[f]);used[f]+=n;missing-=n;}
 return {total,spent:used,available:Object.fromEntries(faces.map(f=>[f,total[f]-used[f]]))};}
 function safeValue(v,depth=0){if(depth>12)throw Error('Estrutura muito profunda.');if(typeof v==='string'){if(v.length>100000)throw Error('Texto muito longo.');return v;}if(typeof v==='number'){if(!Number.isFinite(v))throw Error('Número inválido.');return v;}if(typeof v==='boolean'||v===null)return v;
 if(Array.isArray(v)){if(v.length>1000)throw Error('Lista muito longa.');return v.map(x=>safeValue(x,depth+1));}if(v&&typeof v==='object'){const keys=Object.keys(v),out={};if(keys.length>1000)throw Error('Objeto muito grande.');for(const k of keys){if(['__proto__','prototype','constructor'].includes(k))throw Error('Chave inválida.');out[k]=safeValue(v[k],depth+1);}return out;}throw Error('Valor inválido.');}
 function cleanDraft(input,base){try{if(JSON.stringify(input).length>2000000)return null;const src=input?.schema===base.schema?input:input?.input?.schema===base.schema?input.input:null;if(!src)return null;const out=safeValue(base),flex=new Set(['age','height','swimDecision','pp','moneyRolls']);for(const k of Object.keys(base)){if(!(k in src))continue;const v=safeValue(src[k]),b=base[k];if(Array.isArray(b)){if(!Array.isArray(v))return null;out[k]=v;}else if(b&&typeof b==='object'){if(!v||Array.isArray(v)||typeof v!=='object')return null;out[k]={...b,...v};}else if(typeof v===typeof b||flex.has(k)&&['number','string'].includes(typeof v))out[k]=v;else return null;}
 if(!Number.isInteger(out.level)||out.level<1||out.level>30)return null;for(const a of ['FOR','DES','CON','SAB','VON','PRE'])if(!Number.isInteger(out.base[a])||out.base[a]<1||out.base[a]>40)return null;
 for(const k of ['singularities','defects','trainings','weapons'])if(out[k].some(x=>typeof x!=='string'))return null;for(const v of Object.values(out.skills))if(!Array.isArray(v)||v.some(x=>typeof x!=='string'))return null;for(const v of Object.values(out.levels))if(!v||typeof v!=='object'||Array.isArray(v))return null;if(out.inventory.some(v=>!v||typeof v!=='object'||typeof v.name!=='string'||!Number.isInteger(v.qty)||v.qty<0||v.qty>999))return null;if(typeof src.moneyRolledAt==='string')out.moneyRolledAt=src.moneyRolledAt;return out;}catch{return null;}}
 const api={evaluate,formula,VERSION,level,pp,warriorCR,robustHP,conHP,diePools,safeValue,cleanDraft};root.OP_RULES=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
