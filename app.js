(() => {
  const $ = id => document.getElementById(id);
  const QUESTIONS = window.NSTP_QUESTIONS || [];
  const CONFIG = window.NSTP_CONFIG || {};
  const letters = ["A","B","C","D"];
  let player = {name:"", section:""};
  let round = [], current = 0, score = 0, correctCount = 0, seconds = 20;
  let timer = null, advanceTimer = null, answered = false, lastResult = null;
  let currentOptions = [];
  let leaderboardData = [];

  const screens = ["homeScreen","gameScreen","resultScreen","leaderboardScreen"];
  function showScreen(id){ screens.forEach(s => $(s).classList.toggle("hidden",s!==id)); window.scrollTo({top:0,behavior:"smooth"}); }
  function shuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
  function setStatus(text){ $("connectionStatus").textContent=text; }
  function isOnlineBoard(){ return !!(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey); }
  function localScores(){ try{return JSON.parse(localStorage.getItem("nstp_lts1_scores")||"[]");}catch{return [];} }
  function saveLocal(row){
    const data=localScores(); data.push(row); localStorage.setItem("nstp_lts1_scores",JSON.stringify(data));
  }
  function cleanText(s,max){return String(s||"").trim().slice(0,max);}
  function supabaseHeaders(){return {"apikey":CONFIG.supabaseAnonKey,"Content-Type":"application/json","Prefer":"return=minimal"};}
  async function saveScore(row){
    if(!isOnlineBoard()){saveLocal(row);return "Saved on this device only. Configure the shared leaderboard to let all students see class scores.";}
    const url=CONFIG.supabaseUrl.replace(/\/$/,"")+"/rest/v1/"+(CONFIG.tableName||"nstp_lts1_scores");
    const res=await fetch(url,{method:"POST",headers:supabaseHeaders(),body:JSON.stringify(row)});
    if(!res.ok){const msg=await res.text();throw new Error(msg||"Could not save score.");}
    return "Your score has been added to the shared class leaderboard.";
  }
  async function fetchScores(){
    if(!isOnlineBoard()) return localScores();
    const url=CONFIG.supabaseUrl.replace(/\/$/,"")+"/rest/v1/"+(CONFIG.tableName||"nstp_lts1_scores")+"?select=student_name,class_section,score,correct,total,accuracy,created_at&order=score.desc,accuracy.desc&limit=500";
    const res=await fetch(url,{headers:supabaseHeaders()});
    if(!res.ok){const msg=await res.text();throw new Error(msg||"Could not load scores.");}
    return await res.json();
  }
  function populateModules(){
    const mods=[...new Set(QUESTIONS.map(q=>q.module))].sort();
    mods.forEach(m=>{const o=document.createElement("option");o.value=m;o.textContent=m;$("moduleFilter").appendChild(o);});
  }
  function startGame(){
    player.name=cleanText($("studentName").value,40);
    player.section=cleanText($("studentClass").value,30);
    if(!player.name||!player.section){alert("Please enter your name and class/section before starting.");return;}
    let pool=QUESTIONS.filter(q=>$("difficulty").value==="both"||q.difficulty===$("difficulty").value);
    const mod=$("moduleFilter").value;if(mod!=="all")pool=pool.filter(q=>q.module===mod);
    pool=shuffle(pool);
    const count=$("questionCount").value==="all"?pool.length:Number($("questionCount").value);
    round=pool.slice(0,Math.min(count,pool.length));
    if(!round.length){alert("No questions are available for this selection.");return;}
    current=0;score=0;correctCount=0;showScreen("gameScreen");renderQuestion();
  }
  function renderQuestion(){
    stopTimers();answered=false;seconds=20;
    const q=round[current];
    $("progressText").textContent=`${current+1} / ${round.length}`;
    $("progressBar").style.width=`${(current+1)/round.length*100}%`;
    $("moduleLabel").textContent=q.module;
    $("difficultyLabel").textContent=q.difficulty.toUpperCase();
    $("questionNumber").textContent=String(current+1).padStart(2,"0");
    $("questionText").textContent=q.question;
    $("scoreLive").textContent=`SCORE: ${score}`;
    $("feedback").classList.add("hidden");$("continueBtn").classList.add("hidden");
    currentOptions=shuffle(q.options.map((text,index)=>({text,index})));
    const wrap=$("options");wrap.innerHTML="";
    currentOptions.forEach((opt,i)=>{
      const b=document.createElement("button");b.type="button";b.className="option-btn";
      const letter=document.createElement("span");letter.className="option-letter";letter.textContent=letters[i]+".";
      const txt=document.createElement("span");txt.textContent=opt.text;
      b.append(letter,txt);b.addEventListener("click",()=>chooseAnswer(i));wrap.appendChild(b);
    });
    updateTimer();timer=setInterval(()=>{seconds--;updateTimer();if(seconds<=0){clearInterval(timer);reveal(null,true);}},1000);
  }
  function updateTimer(){
    $("timerText").textContent=seconds+"s";
    $("timerText").style.color=seconds<=5?"var(--red)":"var(--gold)";
    $("timerBar").style.width=(seconds/20*100)+"%";
    $("timerBar").style.background=seconds<=5?"var(--red)":"var(--gold)";
  }
  function chooseAnswer(displayIndex){if(answered)return;clearInterval(timer);const selected=currentOptions[displayIndex].index;reveal(selected,false);}
  function reveal(selected,timeout){
    if(answered)return;answered=true;stopTimers();
    const q=round[current];const right=q.answer;const isCorrect=selected===right;
    if(isCorrect){score+=10;correctCount++;}
    const buttons=[...$("options").querySelectorAll("button")];
    buttons.forEach((b,i)=>{b.disabled=true;const original=currentOptions[i].index;if(original===right)b.classList.add("correct");else if(original===selected)b.classList.add("incorrect");});
    $("scoreLive").textContent=`SCORE: ${score}`;
    const feedback=$("feedback");feedback.classList.remove("hidden");
    const title=document.createElement("strong");
    title.textContent=timeout?"TIME'S UP":(isCorrect?"CORRECT! +10 POINTS":"NOT QUITE");
    const body=document.createElement("p");
    body.textContent=`Answer: ${q.options[right]}. ${q.explanation}`;
    feedback.innerHTML="";feedback.append(title,body);
    $("continueBtn").classList.remove("hidden");
    let remaining=3;
    $("continueBtn").textContent=`CONTINUE (${remaining}) →`;
    advanceTimer=setInterval(()=>{remaining--;if(remaining<=0){stopTimers();nextQuestion();}else{$("continueBtn").textContent=`CONTINUE (${remaining}) →`;}},1000);
  }
  function stopTimers(){if(timer){clearInterval(timer);timer=null;}if(advanceTimer){clearInterval(advanceTimer);advanceTimer=null;}}
  function nextQuestion(){if(!answered)return;stopTimers();current++;if(current>=round.length)finishGame();else renderQuestion();}
  async function finishGame(){
    stopTimers();showScreen("resultScreen");
    const total=round.length,accuracy=Math.round(correctCount/total*100);
    $("resultName").textContent=player.name;$("finalScore").textContent=score;
    $("correctCount").textContent=`${correctCount} / ${total}`;$("accuracy").textContent=accuracy+"%";
    $("classResult").textContent=player.section;
    $("resultRemark").textContent=accuracy>=90?"Excellent work! You showed strong understanding of the lessons.":accuracy>=75?"Very good! Review the explanations for the questions you missed.":accuracy>=60?"Good progress. Keep practicing and revisit the modules.":"Keep going. Use the explanations to strengthen your understanding.";
    $("saveStatus").textContent="Saving your score…";
    const row={student_name:player.name,class_section:player.section,score,correct:correctCount,total,accuracy,created_at:new Date().toISOString()};
    lastResult=row;
    try{$("saveStatus").textContent=await saveScore(row);}catch(e){saveLocal(row);$("saveStatus").textContent="Online save failed; score saved on this device only. "+e.message;}
  }
  function bestPerStudent(rows){
    const map=new Map();
    rows.forEach(r=>{const key=(r.student_name||"").toLowerCase()+"|"+(r.class_section||"").toLowerCase();const old=map.get(key);if(!old||Number(r.score)>Number(old.score)||(Number(r.score)===Number(old.score)&&Number(r.accuracy)>Number(old.accuracy)))map.set(key,r);});
    return [...map.values()].sort((a,b)=>Number(b.score)-Number(a.score)||Number(b.accuracy)-Number(a.accuracy));
  }
  async function openLeaderboard(){
    showScreen("leaderboardScreen");$("leaderboardStatus").textContent="Loading scores…";$("leaderboardRows").innerHTML="";
    try{
      leaderboardData=bestPerStudent(await fetchScores());
      const filter=$("leaderboardFilter");const currentValue=filter.value;
      const sections=[...new Set(leaderboardData.map(r=>r.class_section).filter(Boolean))].sort();
      filter.innerHTML='<option value="all">All classes</option>';
      sections.forEach(s=>{const o=document.createElement("option");o.value=s;o.textContent=s;filter.appendChild(o);});
      if(sections.includes(currentValue))filter.value=currentValue;
      renderLeaderboard();
      $("leaderboardStatus").textContent=isOnlineBoard()?"Shared online class leaderboard":"Local leaderboard preview — visible only in this browser/device until online leaderboard is configured.";
    }catch(e){$("leaderboardStatus").textContent="Could not load the online leaderboard: "+e.message;}
  }
  function renderLeaderboard(){
    const section=$("leaderboardFilter").value;
    const rows=leaderboardData.filter(r=>section==="all"||r.class_section===section).sort((a,b)=>Number(b.score)-Number(a.score)||Number(b.accuracy)-Number(a.accuracy));
    const body=$("leaderboardRows");body.innerHTML="";
    if(!rows.length){const tr=document.createElement("tr");const td=document.createElement("td");td.colSpan=5;td.textContent="No scores yet. Be the first to play!";tr.appendChild(td);body.appendChild(tr);return;}
    rows.forEach((r,i)=>{const tr=document.createElement("tr");[i+1,r.student_name,r.class_section,`${r.score} pts`,`${r.accuracy}%`].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td);});body.appendChild(tr);});
  }
  $("startBtn").addEventListener("click",startGame);
  $("continueBtn").addEventListener("click",nextQuestion);
  $("leaderboardTop").addEventListener("click",openLeaderboard);
  $("leaderboardHome").addEventListener("click",openLeaderboard);
  $("viewBoardBtn").addEventListener("click",openLeaderboard);
  $("refreshBoardBtn").addEventListener("click",openLeaderboard);
  $("leaderboardFilter").addEventListener("change",renderLeaderboard);
  $("backFromBoard").addEventListener("click",()=>showScreen("homeScreen"));
  $("playAgainBtn").addEventListener("click",()=>{showScreen("homeScreen");startGame();});
  $("homeBtn").addEventListener("click",()=>showScreen("homeScreen"));
  populateModules();
  setStatus(isOnlineBoard()?"Shared online leaderboard configured":"Online leaderboard not configured yet");
})();