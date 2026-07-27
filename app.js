
/*
OPTIMUS WALLET
Core Application Engine
*/


// =========================
// DATABASE
// =========================


const DEFAULT_STATE = {

    user:{
        name:"there"
    },


    cards:[],

    bills:[],

    deals:[],


    chat:[]


};



let state = loadState();



function loadState(){

    const saved =
    localStorage.getItem("optimusWallet");


    if(saved){

        return JSON.parse(saved);

    }


    return structuredClone(DEFAULT_STATE);

}



function saveState(){

    localStorage.setItem(
        "optimusWallet",
        JSON.stringify(state)
    );

}



function uid(){

    return crypto.randomUUID();

}





// =========================
// NAVIGATION
// =========================


const pages =
document.querySelectorAll(".page");


const navItems =
document.querySelectorAll(".nav-item");



navItems.forEach(button=>{


    button.onclick=()=>{


        const page =
        button.dataset.page;


        openPage(page);


    };


});




function openPage(page){


    pages.forEach(p=>{

        p.classList.remove("active");

    });



    navItems.forEach(n=>{

        n.classList.remove("active");

    });



    document
    .getElementById(page)
    .classList.add("active");



    document
    .querySelector(
        `[data-page="${page}"]`
    )
    ?.classList.add("active");



    render();

}





// =========================
// GREETING
// =========================



function updateGreeting(){


    const hour =
    new Date().getHours();


    let text =
    "GOOD EVENING";


    if(hour<12)
        text="GOOD MORNING";


    else if(hour<18)
        text="GOOD AFTERNOON";



    document
    .getElementById("greeting")
    .innerText=text;



    document
    .getElementById("userName")
    .innerText=
    state.user.name;


}







// =========================
// CARD ENGINE
// =========================


function bestCard(category){


    if(!state.cards.length)

        return null;



    let best=null;



    state.cards.forEach(card=>{


        let rate =
        card.cashback || 0;



        if(
            card.category &&
            card.category===category
        ){

            rate += 2;

        }



        if(!best || rate>best.rate){

            best={
                card,
                rate
            };

        }


    });



    return best;

}






// =========================
// HOME
// =========================



function renderHome(){


    const hero =
    document.getElementById(
        "recommendation"
    );



    const reason =
    document.getElementById(
        "recommendationReason"
    );



    const result =
    bestCard("general");



    if(!result){


        hero.innerText =
        "Add your cards to begin optimization.";


        reason.innerText =
        "Optimus will analyze rewards once your wallet is connected.";


    }

    else{


        hero.innerText =
        `Use ${result.card.name}`;



        reason.innerText =
        `${result.rate}% estimated reward rate`;

    }





    const bills =
    document.getElementById(
        "upcomingBills"
    );



    if(!state.bills.length){

        bills.innerHTML =
        `<div class="empty">
        No bills added.
        </div>`;

    }

    else{


        bills.innerHTML =
        state.bills
        .slice(0,3)
        .map(
            b=>
            `
            <div class="wallet-card glass">

            <div>
            <strong>${b.name}</strong>
            <br>
            <small>
            $${b.amount}
            </small>

            </div>

            </div>
            `
        )
        .join("");

    }







}








// =========================
// WALLET
// =========================


function renderWallet(){


const container =
document.getElementById(
"cardsContainer"
);



if(!state.cards.length){

container.innerHTML =
`
<div class="empty">
No cards added.
<br><br>
Use + to add your first card.
</div>
`;

return;

}



container.innerHTML =
state.cards
.map(card=>


`
<div class="wallet-card glass">


<div class="card-color"
style="
background:${card.color||'#4ce0d2'}
">
</div>


<div class="card-info">

<div class="card-name">
${card.name}
</div>


<div class="card-meta">

${card.cashback||0}% cashback

</div>

</div>


<button onclick="deleteCard('${card.id}')">
×
</button>


</div>

`

)
.join("");



}







function addCard(){


const name =
prompt(
"Card name"
);


if(!name)
return;



const cashback =
Number(
prompt(
"Cashback %"
)
||0
);



state.cards.push({

id:uid(),

name,

cashback,

color:"#4ce0d2"

});



saveState();

render();



}





function deleteCard(id){


state.cards =
state.cards.filter(
c=>c.id!==id
);


saveState();

render();


}







document
.getElementById("addCard")
.onclick=
addCard;







// =========================
// ADVISOR
// =========================



const categories=[

"Groceries",

"Dining",

"Travel",

"Gas",

"Online",

"Entertainment"

];



function renderAdvisor(){


const grid =
document.getElementById(
"categoryGrid"
);



grid.innerHTML =
categories
.map(
c=>

`
<button class="category"
onclick="advisor('${c}')">

${c}

</button>

`
)
.join("");



}




function advisor(category){


const output =
document.getElementById(
"advisorResult"
);



const result =
bestCard(category);



if(!result){


output.innerHTML=

`
<div class="glass panel">

Add cards first.

</div>

`;

return;


}



output.innerHTML=

`

<div class="glass panel">

<h3>
Use ${result.card.name}
</h3>

<p>
Based only on your saved rewards:
${result.rate}%

</p>

</div>

`;


}







// =========================
// OPTIMUS AI
// =========================



document
.getElementById("sendMessage")
.onclick=
sendMessage;



async function sendMessage(){


const input =
document.getElementById(
"chatInput"
);



const text =
input.value.trim();



if(!text)
return;



input.value="";



addChat(
"user",
text
);



const response =
generateAnswer(text);



addChat(
"assistant",
response
);



}





function addChat(role,text){


const box =
document.getElementById(
"chat"
);



const div =
document.createElement(
"div"
);



div.className=
"message "+role;


div.innerText=text;


box.appendChild(div);


}





function generateAnswer(question){


const q =
question.toLowerCase();



if(
q.includes("card")
||
q.includes("use")
){


if(!state.cards.length)

return:

"I don't have any cards saved yet. Add your wallet details first.";



const card =
state.cards[0];



return:

`Based on your saved cards, I recommend ${card.name}. I only use information you have provided.`;


}





if(
q.includes("bill")
){


if(!state.bills.length)

return:

"You have no bills tracked yet.";


return:

"You have bills saved. Open the Bills section for details.";

}




return:

"I don't have enough information to answer that yet. I won't guess — add more financial data and I can help optimize it.";

}







// =========================
// RENDER
// =========================



function render(){

updateGreeting();

renderHome();

renderWallet();

renderAdvisor();

}




// =========================
// INIT
// =========================



render();

