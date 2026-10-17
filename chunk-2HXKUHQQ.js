function a(t=new Date){let n=t.getFullYear(),e=String(t.getMonth()+1).padStart(2,"0"),r=String(t.getDate()).padStart(2,"0");return`${n}-${e}-${r}`}export{a};
