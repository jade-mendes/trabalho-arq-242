
class Mic1{

    constructor(){
        this.initialRegisters = {
            PC: 0,  // Program Counter
            AC: 0,  // Accumulator
            SP: (255).toString(2).padStart(16, '0'),  // Stack Pointer
            IR: 0,  // Memory Instruction Register
            // TIR: 0, // Temporary Instruction Register
            "Zero": 0, // Zero
            "+1": 1, // Plus One
            "-1": -1, // Minus One
            AMASK: '0000111111111111', // Adress Mask
            SMASK: '0000000011111111', // Stack Mask
            A: 0,    // A Register
            B: 0,    // B Register
            C: 0,    // C Register
            D: 0,    // D Register
            E: 0,    // E Register
            F: 0,    // F Register
            MAR: 0,  // Memory Address Register
            MBR: 0,  // Memory Buffer Register
            AMUX: 0,
            ALU: [0,0], 
            Shifter: 0,
            // ALatch: 0,
            // BLatch: 0,
            N: 0, // Minus One
            Z: 0, // Minus One
        };

        // Memória
        this.initialMemory = new Array(256).fill(0); 

        this.registers = { ...this.initialRegisters };
        this.memory = [...this.initialMemory];
    }

    reset(){
        this.registers = { ...this.initialRegisters }; 
        this.memory = [...this.initialMemory];
    }

    ALU(op) {
        switch (op) {
            case 'ADD': this.registers.Shifter = this.registers.ALU[0] + this.registers.ALU[1]; break;
            case 'SUB': this.registers.Shifter = this.registers.ALU[0] - this.registers.ALU[1]; break;
            case 'AND': this.registers.Shifter = this.registers.ALU[0] & this.registers.ALU[1]; break;
            case 'OR': this.registers.Shifter = this.registers.ALU[0] | this.registers.ALU[1]; break;
            default: return 0;
        }
        this.registers.N = this.registers.Shifter < 0 ? 1 : 0;
        this.registers.Z = this.registers.Shifter === 0 ? 1 : 0;
        return this.registers.Shifter;
    }

    // Unidade de Controle - Função para executar uma microinstrução
    execMicroInst(microOp, address) {
        switch (microOp) {
            // case 'MAR <- PC':
            //     this.registers.MAR = this.registers.PC;
            //     break;
            case 'MBR <- M[MAR]':
                this.registers.MBR = this.memory[this.registers.MAR];
                break;
            case 'PC <- PC + 1':
                this.registers.PC += 1;
                break;
            case 'AC <- MBR':
                this.registers.AC = this.registers.MBR;
                break;
            case 'A <- AC':
                this.registers.A = this.registers.AC;
                break;
            case 'AC <- AC + MBR':
                this.registers.ALU = [this.registers.MBR, this.registers.AC]
                this.registers.AMUX = 1;
                this.ALU('ADD');
                this.registers.AC = this.registers.Shifter;
                break;
            case 'MBR <- AC':
                this.registers.MBR = this.registers.AC;
                break;
            case 'M[MAR] <- MBR':
                this.memory[this.registers.MAR] = this.registers.MBR;
                break;
            case 'PC <- X':  
                this.registers.PC = address;
                return address;
                break;
            case 'PC <- (AC > 0) ? X : PC':
                this.registers.AC > 0 ? this.registers.PC = address : this.registers.PC;
                return this.registers.AC > 0 ? address : null;
                break;
            case 'PC <- (AC === 0) ? X : PC':
                this.registers.AC === 0 ? this.registers.PC = address : this.registers.PC;
                return this.registers.AC === 0 ? address : null;
                break;
            case 'PC <- (AC < 0) ? X : PC':
                this.registers.AC < 0 ? this.registers.PC = address : this.registers.PC;
                return this.registers.AC < 0 ? address : null;
                break;
            case 'PC <- (AC !== 0) ? X : PC':
                this.registers.AC !== 0 ? this.registers.PC = address : this.registers.PC;
                return this.registers.AC !== 0 ? address : null;
                break;
            case 'AC <- AC - MBR':
                this.registers.ALU = [this.registers.MBR, this.registers.AC]
                this.ALU('SUB');
                this.registers.AC = this.registers.Shifter;
                break;
            case 'AC <- AC + MBR':
                this.registers.AC += this.registers.MBR;
                break;
            case 'SP <- SP + 1':
                this.registers.SP += 1;
                break;
            case 'SP <- SP + MAR':
                this.registers.SP = this.registers.SP + this.registers.MAR;
                break;
            case 'SP <- SP + AC':
                this.registers.SP = this.registers.SP + this.registers.AC;
                break;
            case 'SP <- SP - AC':
                this.registers.SP = this.registers.SP - this.registers.AC;
                break;
            case 'M[SP] <- PC':
                this.memory[this.registers.SP] = this.registers.PC;
                break;
            case 'MAR <- SP':
                this.registers.MAR = this.registers.SP;
                break;
            case 'MBR <- M[SP]':
                this.registers.MBR = this.memory[this.registers.SP];
                break;
            case 'AC <- M[SP]':
                this.registers.AC = this.memory[this.registers.SP];
                break;
            case 'M[SP] <- MBR':
                this.memory[this.registers.SP] = this.registers.MBR;
                break;
            case 'M[SP] <- AC':
                this.memory[this.registers.SP] = this.registers.AC;
            default:
                console.log("Microinstrução não suportada: ", microOp);
                break;
        }
    }

    // Simulador de Instruções de Alto Nível
    execMacroInst(instruction, address) {
        let addressBit = address.toString(2).padStart(12, '0');
        switch (instruction) {
            case 'LODD':
                this.registers.IR = "0000" + addressBit;
                this.registers.MAR = address;     // Etapa 1: Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Etapa 2: Lê o valor da memória para MBR
                this.execMicroInst('AC <- MBR');      // Etapa 3: Transfere para o acumulador AC
                break;
            case 'STOD':
                this.registers.IR = "0001" + addressBit;
                this.registers.MAR = address;     // Etapa 1: Carrega o endereço no MAR
                this.execMicroInst('MBR <- AC');      // Etapa 2: Carrega o valor do acumulador para MBR
                this.execMicroInst('M[MAR] <- MBR');     // Etapa 3: Armazena na memória
                break;
            case 'ADDD':
                this.registers.IR = "0010" + addressBit;
                this.registers.MAR = address;     // Etapa 1: Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Etapa 2: Lê o valor da memória para MBR
                this.execMicroInst('AC <- AC + MBR');  // Etapa 3: Soma A e MBR e armazena em AC
                break;
            case 'SUBD':
                this.registers.IR = "0011" + addressBit;
                this.registers.MAR = address;     // Etapa 1: Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Etapa 2: Lê o valor da memória para MBR
                this.execMicroInst('AC <- AC - MBR'); // Etapa 3: Subtrai o valor de MBR de AC
                break;
            case 'JPOS': // Jump 
                this.registers.IR = "0100" + addressBit;
                let res = this.execMicroInst('PC <- (AC > 0) ? X : PC', address);  // Se AC > 0, pula para o endereço no MAR
                return res;
                break;
            case 'JZER': // Jump Zero
                this.registers.IR = "0101" + addressBit;
                this.execMicroInst('PC <- (AC === 0) ? X : PC', address);  // Se AC == 0, pula para o endereço no MAR
                return address;
                break;
            case 'JUMP': // Jump
                this.registers.IR = "0110" + addressBit;
                this.execMicroInst('PC <- X', address);  // Pula para o endereço no MAR
                return address;
                break;
            case 'LOCO': // Load Constant
                this.registers.IR = "0111" + addressBit;
                this.registers.MBR = address; 
                this.registers.AC = address; 
                break;
            case 'LODL': // Load Local
                this.registers.IR = "1000" + addressBit;
                this.registers.MAR = address;     
                this.execMicroInst('SP <- SP + MAR');
                this.execMicroInst('AC <- M[SP]');
                break;
            case 'STOL': // Store Local
                this.registers.IR = "1001" + addressBit;
                this.registers.MAR = address;    
                this.execMicroInst('SP <- SP + MAR');
                this.execMicroInst('M[SP] <- AC');
                break;
            case 'ADDL': // Add Local
                this.registers.IR = "1010" + addressBit;
                this.registers.MAR = address;     
                this.execMicroInst('SP <- SP + MAR');
                this.execMicroInst('MBR <- M[SP]');
                this.execMicroInst('AC <- AC + MBR');
                break;
            case 'SUBL': // Subtract Local
                this.registers.IR = "1011" + addressBit;
                this.registers.MAR = address;     
                this.execMicroInst('SP <- SP + MAR');
                this.execMicroInst('MBR <- M[SP]');
                this.execMicroInst('AC <- AC - MBR');
                break;
            case 'JNEG': // Jump Negative
                this.registers.IR = "1100" + addressBit;
                this.execMicroInst('PC <- (AC < 0) ? X : PC', address); // Se AC < 0, pula para o endereço no MAR
                return address;
                break;
            case 'JNZE': // Jump Not Zero
                this.registers.IR = "1101" + addressBit;
                this.execMicroInst('PC <- (AC !== 0) ? X : PC', address); // Se AC != 0, pula para endereço no MAR
                return address;
                break;
            case 'CALL': // Call Subroutine
                this.registers.IR = "1110" + addressBit;
                this.registers.MAR = address; // Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor da memória
                this.execMicroInst('SP <- SP - 1'); // Decrementa o Stack Pointer (SP)
                this.execMicroInst('M[SP] <- PC');  // Armazena o endereço de retorno no stack
                this.execMicroInst('PC <- MAR');  // Pula para a sub-rotina
                break;   
            case 'PSHI': // Push Indirect
                this.registers.IR = "1111".padEnd(16, '0');
                this.execMicroInst('MAR <- SP');  // Carrega o valor do stack pointer no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor da memória para o MBR
                this.execMicroInst('M[MAR] <- MBR');  // Armazena o valor no stack
                break;
            case 'POPI': // Pop Indirect
                this.registers.IR = "1111001".padEnd(16, '0');
                this.execMicroInst('MAR <- SP');  // Carrega o valor do stack pointer no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor de memória para MBR
                this.execMicroInst('SP <- SP + 1');  // Incrementa o Stack Pointer
                break;
            case 'PUSH': // Push
                this.registers.IR = "111101".padEnd(16, '0');
                this.execMicroInst('SP <- SP - 1');   // Decrementa o Stack Pointer
                this.execMicroInst('M[SP] <- AC');   // Armazena o valor de AC no topo da pilha
                break;
            case 'POP': // Pop
                this.registers.IR = "1111011".padEnd(16, '0');
                this.execMicroInst('MBR <- M[SP]');  // Lê o valor do topo da pilha para MBR
                this.execMicroInst('AC <- MBR');     // Transfere o valor de MBR para o AC
                this.execMicroInst('SP <- SP + 1');   // Incrementa o Stack Pointer
                break;
            case 'RETN': // Return from Subroutine
                this.registers.IR = "11111".padEnd(16, '0');
                this.execMicroInst('MBR <- M[SP]');   // Lê o valor de retorno da pilha para MBR
                this.execMicroInst('PC <- MAR');      // Transfere o endereço no MAR para o PC
                this.execMicroInst('SP <- SP + 1');   // Incrementa o Stack Pointer
                break;
            case 'SWAP': // Swap
                this.registers.IR = "1111101".padEnd(16, '0');
                this.execMicroInst('MBR <- AC');      // Transfere o valor de AC para MBR
                this.execMicroInst('AC <- M[SP]');    // Carrega o valor de memória no topo da pilha para AC
                this.execMicroInst('M[SP] <- MBR');   // Armazena o valor de MBR de volta na pilha
                break;
            case 'INSP': // Increment Stack Pointer
                this.registers.IR = "11111100" + address.toString(2).padStart(8, '0');
                this.registers.MBR = address;
                this.registers.AC = address;
                this.execMicroInst('SP <- SP + AC');
                break;
            case 'DESP': // Decrement Stack Pointer
                this.registers.IR = "11111110" + address.toString(2).padStart(8, '0');
                this.registers.MBR = address;
                this.registers.AC = address;
                this.execMicroInst('SP <- SP - AC');
                break;
            default:
                console.log("Instrução não suportada: ", instruction);
                alert("Instrução não suportada: " + instruction);
                break;
        }
        this.execMicroInst('PC <- PC + 1'); // Avança o contador de programa
    }
}

class SimulatorGUI {
    
    constructor(simulator, history) {
        this.simulator = simulator;
        this.history = history;
        this.program = []
        this.historyIndex = 0;
        this.createWidgets();
    }

    createWidgets() {
        this.updateRegisters();
        this.updateMemory();
    }

    toBinary(value, bitLength) {
        if (value < 0) {
            value = (1 << bitLength) + value; 
        }
        return value.toString(2).padStart(bitLength, '0'); 
    }

    updateRegisters() {
        const registersDiv = document.getElementById('registers');
        registersDiv.innerHTML = '';
        for (const reg in this.simulator.registers) {
            const span = document.createElement('span');
            span.innerHTML = `<em>${reg}:</em> ${this.simulator.registers[reg]}`;
            registersDiv.appendChild(span);
        }
    }

    updateMemory() {
        const memoryDiv = document.getElementById('memory');
        memoryDiv.innerHTML = '';
        for (let i = 0; i < this.simulator.memory.length; i++) {
            const span = document.createElement('span');
            span.innerHTML = `<em>${i}:</em> ${this.toBinary(this.simulator.memory[i], 16)} ( ${this.simulator.memory[i]} )`;
            memoryDiv.appendChild(span);
        }
    }

    updateCurrent(){
        const currentInst = document.getElementById("currentInst");
        // if(this.historyIndex==0){
        //     currentInst.innerText = " ";
        // } else
        // currentInst.innerText = this.program[this.simulator.registers.PC - 1][0] + " " + this.program[this.simulator.registers.PC - 1][1];
    }

    loadHistory(index = 0){
        let instance = this.history.getInstance(index);
        console.log(instance);
        this.historyIndex = index;
        this.simulator.memory = instance.memory;
        this.simulator.registers = instance.registers;
    }

    historyChanges(currentIndex, instance){
        let previous = this.history.getInstance(currentIndex -1);
        let components = [];
        if (previous){
            if(JSON.stringify(previous.memory) !== JSON.stringify(instance.memory)){
                components.push("Memory");
            }
            const allKeys = new Set([...Object.keys(instance.registers)]);
            allKeys.forEach(key => {
                if (instance.registers[key] !== previous.registers[key]) {
                    components.push(key); // Adicionar chave ao vetor se os valores forem diferentes
                }
            });
        }
        return components;
    }

    navigateHistory(offset = 1){
        let instance = this.history.getInstance(this.historyIndex + offset);
        
        if (instance) {
            this.simulator.memory = instance.memory;
            this.simulator.registers = instance.registers;
            let components = this.historyChanges(this.historyIndex + offset, instance);
            this.highLightComp(components);
            this.historyIndex += offset;
            this.updateMemory();
            this.updateRegisters();
            this.updateCurrent();
        }
    }

    runProgram(program){
        this.simulator.reset();
        this.program = program;
        history.clear();
        let count = 0;
        console.log(program);
        
        for (let i = 0; i < program.length; i++) {
            history.addInstance(this.simulator.registers, this.simulator.memory);
            let res = this.simulator.execMacroInst(program[i][0], program[i][1]);
            console.log(res);
            
            if(res){count++; i = res - 1}
        }
        history.addInstance(this.simulator.registers, this.simulator.memory);
        this.loadHistory(0);
    }

    highLightComp(components){
        let allComp = ["PC", "AC", "SP", "IR", "TIR", "Zero", "plusOne", "minusOne", "Amask", "Smask", "A", "B", "C", "D", "E", "F", "Memory"]
        allComp.forEach(component => {
            let element = document.getElementById(component);
            if (components.find((element) => element == component)) {
                element?.classList.add("pulsing");
            }else{
                element?.classList.remove("pulsing");
            }
        });
    }
}

var init = false;
var swiper;
function swiperCard() {
  if (window.innerWidth <= 850) {
    if (!init) {
      init = true;
      swiper = new Swiper(".swiper", {
        direction: "horizontal",
        centeredSlides: true,
        loop: false,
        initialSlide: 1,
      });
    }
  } else if (init) {
    swiper.destroy();
    init = false;
  }
}
swiperCard();
window.addEventListener("resize", swiperCard);

const mic2 = new Mic1();
const history = new History();
const gui = new SimulatorGUI(mic2, history);
let program = [];
HeaderStyle = document.querySelector(".controller").style;

runBT = document.getElementById("runBt");
runBT.onclick = () => {
    gui.runProgram(program);
    gui.updateRegisters();
    gui.updateMemory();
    HeaderStyle.setProperty('--progress', 0);
}
stepBT = document.getElementById("stepBt");
stepBT.onclick = (e) => {
    gui.navigateHistory(1);
    let progress = (1 / ((history.instances.length-1) / (gui.historyIndex))).toFixed(2);
    HeaderStyle.setProperty('--progress', progress);
}
backBT = document.getElementById("backBt");
backBT.onclick = (e) => {
    gui.navigateHistory(-1);
    let progress = (1 / ((history.instances.length-1) / (gui.historyIndex))).toFixed(2);
    HeaderStyle.setProperty('--progress', progress);
}
editBt = document.getElementById("editBt");
editDialog = document.getElementById("editDialog");
editBt.onclick = (e) => {
    editDialog.showModal();
}

cancelBt = document.getElementById("modalCancel");
cancelBt.onclick = (e) => {
    editDialog.close();
}
submitBt = document.getElementById("modalSubmit");
submitBt.onclick = (e) => {
    const textarea = document.getElementById('txtProgram').value;
    const lines = textarea.split('\n');
    program = [];

    lines.forEach((line, index) => {
        program.push(line.trim().split(' '));
        program[index][1] = parseInt(program[index][1]);
        
    });
    console.log(program);

    editDialog.close();
}
