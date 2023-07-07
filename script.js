//const controller = new AbortController();
let wordLength = 6;
let maxRow = 6;
const rangeLength = [5, 8];
const rangeRow = [6, 8];
const URL_BACKEND = 'https://maximegenand-porfolio-backend.vercel.app/';

let idBox, focusRow, focusColumn, maxColumn, answer;
const inputArr = [];
const keyboard = document.getElementById('keyboard').querySelectorAll('button');

// Fonction timeout
function timeout(duration) {
    return new Promise(resolve => setTimeout(resolve, duration));
}

// Fonction qui affiche un message dans la div popup-message
async function popupMessage (text, duration = 0) {
    const selector = document.querySelector('#popup-message');
    if (text !== '') {
        selector.textContent = text;
        selector.style.display = 'block';
    }
    if (duration || text === '') {
        await timeout(duration);
        selector.style.display = 'none';
        selector.textContent = '';
    }
}

// Fonction qui change le focus sur la box actuelle
function changeBox(axe = 'init', increment = 1) {
    if (axe === 'init') focusRow = focusColumn = increment = 0;
    else if (axe === 'row') {
        focusRow += increment;
        focusColumn = 0;
    }
    else focusColumn += increment;
    idBox = 'box-'+focusRow+'-'+focusColumn;
}

// Fonction qui ajoute/enleve des classes
async function changeClass (idSelect, element, duration = 0) {
    const selector = document.getElementById(idSelect);
    //console.log(idSelect, selector)

    if(element.text) selector.textContent = element.text;
    if(element.style) selector.style[element.style] = element.value;
    if(element.class) selector.classList.add(element.class);

    if(duration) {
        await timeout(duration);
        if(element.class) selector.classList.remove(element.class);
    }
}

// Fonction qui créé un listener dans la case choisie
async function cellEvent(event) {
    let keyValue = '';
    if (event.type === "submit") keyValue = event.id;
    else if (event.type === "keyup") keyValue = event.key;
    keyValue = keyValue.toUpperCase();
    //console.log(event)

    // Si la touche return ou delete est appuyée et qu'on est pas sur la première colonne, on efface la dernière lettre
    if ((keyValue === 'BACKSPACE' || keyValue === 'DELETE') && focusColumn > 0) {
        if (focusColumn < maxColumn) changeClass(idBox, { style: 'border-color', value: '#808080' });
        changeBox('column', -1);
        changeClass(idBox, { style: 'border-color', value: 'white' });
        changeClass('BACKSPACE', { class: 'click' }, 100);

        if (focusColumn === 0) inputArr.pop();
        else inputArr[focusRow].pop();
        changeClass(idBox, { text: ' ' });
        console.log('Row:', focusRow, '- Column:', focusColumn, ' - key:', keyValue);
    }
    // On vérifie que la touche est une lettre de l'alphabet et que le focus n'est pas sur la dernière colonne
    else if(/^[a-z]$/i.test(keyValue) && focusColumn < maxColumn) {
        changeClass(idBox, { text: keyValue, style: 'border-color', value: '#808080' });
        changeClass(idBox, { class: 'box-blink' }, 200);
        // On enregistre tous les inputs dans un tableau
        if (focusColumn === 0) inputArr.push([keyValue]);
        else inputArr[focusRow].push(keyValue);

        console.log('Row:', focusRow, '- Column:', focusColumn, ' - key:', keyValue);

        changeBox('column');
        changeClass(keyValue, { class: 'click' }, 100);
        if (focusColumn < maxColumn) changeClass(idBox, { style: 'border-color', value: 'white' });
    }
    // Si on est en fin de ligne et que le input est la touche entrée
    else if (keyValue === 'ENTER' && focusColumn === maxColumn) {
        changeClass('ENTER', { class: 'click' }, 100);
        // On vérifie que le mot existe
        const wordSearch = inputArr[focusRow].join('').toLowerCase();
        const res = await fetch(`${URL_BACKEND}wordle/check/${wordSearch}`);
        const data = await res.json();

        // Si le mot existe, on vérifie le placement des lettres
        if (data.result) {
            const watchedArr = inputArr[focusRow];
            const answerArr = answer.split('');

            // On map pour chaque lettre
            const checkArr = watchedArr.map((value, index) => {
                // Si la lettre est à sa place
                if(value === answerArr[index]) {
                    answerArr[index] = '';
                    return 'green';
                }
                // Si la lettre existe mais n'est pas à sa place
                else if(answerArr.includes(value)) {
                    const indexRemove = answerArr.indexOf(value);
                    answerArr[indexRemove] = '';
                    return 'yellow';
                }
                // Sinon
                else return 'grey';
            });

            // On effectue les changements CSS sur la ligne ainsi que sur le clavier virtuel
            checkArr.map ((color, index) => {
                let renderColor = 'rgb(58, 58, 60)';
                if(color === 'green') renderColor = 'rgb(83, 141, 78)';
                else if(color === 'yellow') renderColor = 'rgb(181, 159, 59)';

                // On change la couleur des boxs avec une animation
                const delay = index * 100;
                const box = 'box-'+(focusRow)+'-'+index;
                changeClass(box, { style: 'background-color', value: renderColor});
                changeClass(box, { class: 'box-flip', style: 'animation-delay', value: delay+'ms' }, delay + 1000);

                // On change la couleur des touches du clavier virtuel sans écraser les valeurs supérieures
                const selectedKeyboard = document.getElementById(watchedArr[index]);
                let changeColor = false;
                // Seulement si now != vert || now 
                if (
                    color === 'green'
                    || ( color === 'yellow' && selectedKeyboard.style.backgroundColor !== 'rgb(83, 141, 78)' )
                    || ( color === 'grey' && selectedKeyboard.style.backgroundColor !== 'rgb(83, 141, 78)' && selectedKeyboard.style.backgroundColor !== 'rgb(181, 159, 59)' )
                ) changeColor = true;
                if (changeColor) selectedKeyboard.style.backgroundColor = renderColor;
            });

            // Si le joueur a gagné
            if(checkArr.every(value => value === 'green')) {
                popupMessage('GAGNÉ !', 5000);
                document.body.removeEventListener('keyup', cellEvent);
            }
            // Si le joueur a perdu
            else if ( focusRow === maxRow - 1 ) {
                popupMessage('GAME OVER. Le mot était '+answer, 10000);
                document.body.removeEventListener('keyup', cellEvent);
            }
            // Si les lettres ne matchent pas toutes mais qu'on n'est pas à la dernière ligne
            else {
                changeBox('row');
                changeClass(idBox, { style: 'border-color', value: 'white' });
            }
        }
        // Si le mot n'existe pas
        else {
            popupMessage('Mot inexistant !', 1500);
            changeClass('row-'+focusRow, { class: 'row-blink' }, 500);
        }
    }
    // S'il manque des lettres
    else if (keyValue === 'ENTER') {
        popupMessage('Manque de lettres !', 1000);
    }
    else console.log('Wrong input :', keyValue);
    keyValue = '';
}

// Fonction qui initialise la grille
async function createGrid(event = false) {
    //console.log(event)
    try {
        // On réinitialise les données d'input du joueur
        inputArr.splice(0);
        // On retire le focus du boutton
        if (event) event.target.blur();
        // On remove les listeners des touches clavier
        document.body.removeEventListener('keyup', cellEvent);

        // On récupère un mot au hasard
        const fetchWord = await fetch(`${URL_BACKEND}wordle/random/${wordLength}`);
        const resWord = await fetchWord.json();

        // On initialise les valeurs qui concernent le mot
        answer = resWord.word.word.toUpperCase();
        maxColumn = resWord.word.length;
        changeBox();
        
        // On réinitialise l'affichage de la fenêtre popup
        console.log(resWord.word);
        popupMessage('');

        // Création de l'affichage de la grille
        let gameBoard = '';
        for(let i=0 ; i < maxRow ; i++) {
            gameBoard += '<div id="row-'+i+'" class="letter-row">';
            for(let j=0 ; j < maxColumn ; j++) gameBoard += '<div id="box-'+i+'-'+j+'" class="letter-box"></div>';
            gameBoard += '</div>';
        }
        document.getElementById('game-board').innerHTML = gameBoard;

        // On entoure la première case à écouter et on créé l'event listener
        changeClass(idBox, { style: 'border-color', value: 'white' });
        document.body.addEventListener('keyup', cellEvent);

        // On réinitialise les couleurs du keyboard virtuel
        for (let keyValue of keyboard) changeClass(keyValue.id, { style: 'background-color', value: ''});

    }
    catch { console.log('Error') }
}

// Fonction qui change la longueur des mots (de 5 à 8 lettres)
function sizeGrid(event) {
    let increment = 0;
    if (event.id === 'up') increment++;
    else if (event.id === 'down') increment--;
    else console.log('Error');

    // On vérifie si la nouvelle longueur du mot est dans le range défini
    const newLength = wordLength + increment;
    if(newLength >= rangeLength[0] && newLength <= rangeLength[1]) {
        wordLength = newLength;
        // On change le nombre de lignes tant qu'on est dans le range
        if(newLength >= rangeRow[0] && newLength <= rangeRow[1]) maxRow = newLength;
        document.getElementById('words-length').textContent = wordLength;

        // On disable la flèche si on ne peut plus incrémenter
        let abordUp = abordDown = false;
        if (newLength === rangeLength[1]) abordUp = true;
        if (document.getElementById('up').disabled !== abordUp) document.getElementById('up').disabled = abordUp;
        if (newLength === rangeLength[0]) abordDown = true;
        if (document.getElementById('down').disabled !== abordDown) document.getElementById('down').disabled = abordDown;
        //console.log(document.getElementById('up').disabled, abordUp, ' - ',document.getElementById('down').disabled, abordDown);
        createGrid();
    }
    else console.log('Error, not in range');
};

// On créé un eventListener pour chaque touche du keyboard virtuel
for (let keyValue of keyboard) keyValue.addEventListener('click', () => cellEvent(keyValue));

// Initialisation de la grille
document.getElementById('newGame').addEventListener('click', createGrid);
document.getElementById('up').addEventListener('click', () => sizeGrid(document.getElementById('up')));
document.getElementById('down').addEventListener('click', () => sizeGrid(document.getElementById('down')));
createGrid();