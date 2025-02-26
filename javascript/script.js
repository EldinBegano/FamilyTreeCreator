let familyData = {
    members: {},
    relationships: []
};

let selectedMember = null;
let nextId = 1;
let zoomLevel = 1;
let dragStart = null;
let treePosition = { x: 0, y: 0 };
let positionGrids = {
    parent: [],
    child: [],
    spouse: [],
    sibling: []
};

const initialForm = document.getElementById('initial-form');
const addRelativeForm = document.getElementById('add-relative-form');
const editMemberForm = document.getElementById('edit-member-form');
const familyTreeElement = document.getElementById('family-tree');
const familyTreeContainer = document.getElementById('tree-container');

document.getElementById('create-first-member').addEventListener('click', createFirstMember);
document.getElementById('add-member').addEventListener('click', addNewMember);
document.getElementById('save-edit').addEventListener('click', saveEditMember);
document.getElementById('delete-member').addEventListener('click', deleteMember);
document.getElementById('add-relative-btn').addEventListener('click', showAddRelativeForm);
document.getElementById('cancel-add').addEventListener('click', () => {
    addRelativeForm.classList.add('hidden');
    editMemberForm.classList.remove('hidden');
});
document.getElementById('cancel-edit').addEventListener('click', () => {
    editMemberForm.classList.add('hidden');
    clearSelection();
});

document.getElementById('zoom-in').addEventListener('click', () => {
    zoomLevel *= 1.2;
    updateTreeTransform();
});

document.getElementById('zoom-out').addEventListener('click', () => {
    zoomLevel *= 0.8;
    updateTreeTransform();
});

document.getElementById('reset-view').addEventListener('click', () => {
    zoomLevel = 1;
    treePosition = { x: 0, y: 0 };
    updateTreeTransform();
});

familyTreeContainer.addEventListener('mousedown', startDrag);
familyTreeContainer.addEventListener('touchstart', startDrag, { passive: false });
familyTreeContainer.addEventListener('mousemove', drag);
familyTreeContainer.addEventListener('touchmove', drag, { passive: false });
window.addEventListener('mouseup', endDrag);
window.addEventListener('touchend', endDrag);

familyTreeContainer.addEventListener('keydown', handleKeyNavigation);

function handleKeyNavigation(e) {
    const step = 50;
    
    switch(e.key) {
        case 'ArrowUp':
            treePosition.y += step;
            e.preventDefault();
            break;
        case 'ArrowDown':
            treePosition.y -= step;
            e.preventDefault();
            break;
        case 'ArrowLeft':
            treePosition.x += step;
            e.preventDefault();
            break;
        case 'ArrowRight':
            treePosition.x -= step;
            e.preventDefault();
            break;
        case '+':
        case '=':
            zoomLevel *= 1.1;
            e.preventDefault();
            break;
        case '-':
        case '_':
            zoomLevel *= 0.9;
            e.preventDefault();
            break;
        case 'Escape':
            if (!addRelativeForm.classList.contains('hidden')) {
                addRelativeForm.classList.add('hidden');
                editMemberForm.classList.remove('hidden');
            } else if (!editMemberForm.classList.contains('hidden')) {
                editMemberForm.classList.add('hidden');
                clearSelection();
            }
            e.preventDefault();
            break;
        case 'Enter':
            if (selectedMember && editMemberForm.classList.contains('hidden')) {
                editMemberForm.classList.remove('hidden');
            }
            e.preventDefault();
            break;
    }
    
    updateTreeTransform();
}

function startDrag(e) {
    if (e.target === familyTreeContainer || e.target === familyTreeElement) {
        e.preventDefault();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        dragStart = {
            x: clientX - treePosition.x,
            y: clientY - treePosition.y
        };
    }
}

function drag(e) {
    if (dragStart) {
        e.preventDefault();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        treePosition.x = clientX - dragStart.x;
        treePosition.y = clientY - dragStart.y;
        updateTreeTransform();
    }
}

function endDrag() {
    dragStart = null;
}

function updateTreeTransform() {
    familyTreeElement.style.transform = `translate(${treePosition.x}px, ${treePosition.y}px) scale(${zoomLevel})`;
}

function createFirstMember() {
    const name = document.getElementById('init-name').value.trim();
    const birthdate = document.getElementById('init-birthdate').value;
    const imageInput = document.getElementById('init-image');
    
    if (!name) {
        alert('Please enter a name');
        return;
    }
    
    const memberId = 'member-' + nextId++;
    const member = {
        id: memberId,
        name: name,
        birthdate: birthdate,
        image: null,
        position: { x: 0, y: 0 }
    };
    
    positionGrids = {
        parent: [],
        child: [],
        spouse: [],
        sibling: []
    };

    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            member.image = e.target.result;
            completeFirstMemberCreation(member);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        completeFirstMemberCreation(member);
    }
}

function completeFirstMemberCreation(member) {
    familyData.members[member.id] = member;
    initialForm.classList.add('hidden');
    renderFamilyTree();
    
    familyTreeContainer.focus();
}

function addNewMember() {
    if (!selectedMember) return;
    
    const relationType = document.getElementById('relation-type').value;
    const name = document.getElementById('new-name').value.trim();
    const birthdate = document.getElementById('new-birthdate').value;
    const imageInput = document.getElementById('new-image');
    
    if (!name) {
        alert('Please enter a name');
        return;
    }
    
    const memberId = 'member-' + nextId++;
    const newPosition = calculateNewPosition(selectedMember, relationType);
    
    const newMember = {
        id: memberId,
        name: name,
        birthdate: birthdate,
        image: null,
        position: newPosition
    };
    
    familyData.relationships.push({
        from: relationType === 'child' ? memberId : selectedMember.id,
        to: relationType === 'child' ? selectedMember.id : memberId,
        type: relationType
    });
    
    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            newMember.image = e.target.result;
            completeNewMemberAddition(newMember);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        completeNewMemberAddition(newMember);
    }
}

function completeNewMemberAddition(newMember) {
    familyData.members[newMember.id] = newMember;
    addRelativeForm.classList.add('hidden');
    renderFamilyTree();
    
    familyTreeContainer.focus();
}

function calculateNewPosition(member, relationType) {
    const baseX = member.position.x;
    const baseY = member.position.y;
    const spacing = 250;
    let offset;
    
    if (!positionGrids[relationType]) {
        positionGrids[relationType] = [];
    }
    
    const grid = positionGrids[relationType];
    let position = 0;
    
    while (grid.includes(position)) {
        position++;
    }
    
    grid.push(position);
    grid.sort((a, b) => a - b);
    
    offset = position;
    
    let offsetX = 0;
    
    switch (relationType) {
        case 'parent':
            offsetX = (offset % 2 === 0) ? (offset / 2) * spacing : -Math.ceil(offset / 2) * spacing;
            return { x: baseX + offsetX, y: baseY - spacing };
        case 'child':
            offsetX = (offset % 2 === 0) ? (offset / 2) * spacing : -Math.ceil(offset / 2) * spacing;
            return { x: baseX + offsetX, y: baseY + spacing };
        case 'spouse':
            return { x: baseX + spacing + (offset * 50), y: baseY };
        case 'sibling':
            return { x: baseX - spacing - (offset * 50), y: baseY };
        default:
            return { x: baseX + (Math.random() * 100), y: baseY + (Math.random() * 100) };
    }
}

function renderFamilyTree() {
    familyTreeElement.innerHTML = '';
    
    rebuildPositionGrids();
    
    for (const id in familyData.members) {
        const member = familyData.members[id];
        renderMember(member);
    }
    
    renderRelationshipLines();
}

function rebuildPositionGrids() {
    positionGrids = {
        parent: [],
        child: [],
        spouse: [],
        sibling: []
    };
    
    familyData.relationships.forEach(rel => {
        const fromMember = familyData.members[rel.from];
        const toMember = familyData.members[rel.to];
        
        if (!fromMember || !toMember) return;
        
        let gridPosition;
        
        switch (rel.type) {
            case 'parent':
                gridPosition = Math.round(Math.abs(fromMember.position.x - toMember.position.x) / 50);
                if (!positionGrids.parent.includes(gridPosition)) {
                    positionGrids.parent.push(gridPosition);
                }
                break;
            case 'child':
                gridPosition = Math.round(Math.abs(toMember.position.x - fromMember.position.x) / 50);
                if (!positionGrids.child.includes(gridPosition)) {
                    positionGrids.child.push(gridPosition);
                }
                break;
            case 'spouse':
                gridPosition = Math.round((fromMember.position.x - toMember.position.x) / 50);
                if (gridPosition < 0 && !positionGrids.spouse.includes(Math.abs(gridPosition))) {
                    positionGrids.spouse.push(Math.abs(gridPosition));
                }
                break;
            case 'sibling':
                gridPosition = Math.round((toMember.position.x - fromMember.position.x) / 50);
                if (gridPosition < 0 && !positionGrids.sibling.includes(Math.abs(gridPosition))) {
                    positionGrids.sibling.push(Math.abs(gridPosition));
                }
                break;
        }
    });
    
    for (const type in positionGrids) {
        positionGrids[type].sort((a, b) => a - b);
    }
}

function renderMember(member) {
    const memberElement = document.createElement('div');
    memberElement.className = 'member';
    memberElement.id = member.id;
    memberElement.style.left = member.position.x + 'px';
    memberElement.style.top = member.position.y + 'px';
    
    const imgContainer = document.createElement('div');
    imgContainer.className = 'member-img';
    
    if (member.image) {
        const img = document.createElement('img');
        img.src = member.image;
        img.alt = member.name;
        imgContainer.appendChild(img);
    } else {
        imgContainer.innerHTML = '<svg viewBox="0 0 24 24" width="40" height="40"><path fill="#6c96c5" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';
    }
    
    const nameElement = document.createElement('div');
    nameElement.className = 'member-name';
    nameElement.textContent = member.name;
    
    const infoElement = document.createElement('div');
    infoElement.className = 'member-info';
    
    if (member.birthdate) {
        const date = new Date(member.birthdate);
        infoElement.textContent = `Born: ${formatDate(date)}`;
    }
    
    memberElement.appendChild(imgContainer);
    memberElement.appendChild(nameElement);
    memberElement.appendChild(infoElement);
    
    memberElement.addEventListener('click', () => selectMember(member));
    
    familyTreeElement.appendChild(memberElement);
}

function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

function renderRelationshipLines() {
    familyData.relationships.forEach(relationship => {
        const fromMember = familyData.members[relationship.from];
        const toMember = familyData.members[relationship.to];
        
        if (!fromMember || !toMember) return;
        
        const fromElement = document.getElementById(fromMember.id);
        const toElement = document.getElementById(toMember.id);
        
        if (!fromElement || !toElement) return;
        
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();
        
        const treeRect = familyTreeElement.getBoundingClientRect();
        
        const fromX = fromMember.position.x + 100;
        const fromY = fromMember.position.y + 75;
        const toX = toMember.position.x + 100;
        const toY = toMember.position.y + 75;
        
        drawLine(fromX, fromY, toX, toY, relationship.type);
    });
}

function drawLine(x1, y1, x2, y2, type) {
    const line = document.createElement('div');
    line.className = 'relationship-line';
    
    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    
    line.style.width = length + 'px';
    line.style.height = '3px';
    line.style.left = x1 + 'px';
    line.style.top = y1 + 'px';
    line.style.transform = `rotate(${angle}deg)`;
    line.style.transformOrigin = '0 0';
    
    if (type === 'spouse') {
        line.style.borderTop = '3px dashed var(--secondary-color)';
        line.style.backgroundColor = 'transparent';
    }
    
    familyTreeElement.appendChild(line);
}

function selectMember(member) {
    clearSelection();
    
    selectedMember = member;
    const element = document.getElementById(member.id);
    if (element) {
        element.classList.add('selected');
    }
    
    document.getElementById('edit-name').value = member.name;
    document.getElementById('edit-birthdate').value = member.birthdate || '';
    
    editMemberForm.classList.remove('hidden');
}

function showAddRelativeForm() {
    if (!selectedMember) return;
    
    editMemberForm.classList.add('hidden');
    addRelativeForm.classList.remove('hidden');
    
    document.getElementById('new-name').value = '';
    document.getElementById('new-birthdate').value = '';
    document.getElementById('new-image').value = '';
}

function saveEditMember() {
    if (!selectedMember) return;
    
    const name = document.getElementById('edit-name').value.trim();
    const birthdate = document.getElementById('edit-birthdate').value;
    const imageInput = document.getElementById('edit-image');
    
    if (!name) {
        alert('Please enter a name');
        return;
    }
    
    selectedMember.name = name;
    selectedMember.birthdate = birthdate;
    
    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            selectedMember.image = e.target.result;
            completeEditMember();
    };
    reader.readAsDataURL(imageInput.files[0]);
} else {
    completeEditMember();
}
}
function completeEditMember() {
editMemberForm.classList.add('hidden');
clearSelection();
renderFamilyTree();
}

function deleteMember() {
if (!selectedMember) return;

if (confirm(`Are you sure you want to delete ${selectedMember.name}?`)) {
    familyData.relationships = familyData.relationships.filter(rel => 
        rel.from !== selectedMember.id && rel.to !== selectedMember.id
    );
    
    delete familyData.members[selectedMember.id];
    
    editMemberForm.classList.add('hidden');
    clearSelection();
    renderFamilyTree();
}
}

function clearSelection() {
if (selectedMember) {
    const element = document.getElementById(selectedMember.id);
    if (element) {
        element.classList.remove('selected');
    }
    selectedMember = null;
}
}

function loadSavedData() {
const savedData = localStorage.getItem('familyTreeData');
if (savedData) {
    try {
        familyData = JSON.parse(savedData);
        let maxId = 0;
        for (const id in familyData.members) {
            const numId = parseInt(id.replace('member-', ''));
            if (numId > maxId) maxId = numId;
        }
        nextId = maxId + 1;
        
        initialForm.classList.add('hidden');
        renderFamilyTree();
    } catch (e) {
        console.error('Error loading saved data:', e);
    }
}
}

function saveData() {
localStorage.setItem('familyTreeData', JSON.stringify(familyData));
}

setInterval(saveData, 5000);

loadSavedData();