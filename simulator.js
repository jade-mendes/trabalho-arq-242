
class Mic1{

    constructor(){
        this.initialRegisters = {
            PC: 0,  // Program Counter
            AC: 0,  // Accumulator
            SP: (255).toString(2).padStart(16, '0'),  // Stack Pointer
            IR: 0,  // Memory Instruction Register
            TIR: 0, // Temporary Instruction Register
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
    execMicroInst(microOp) {
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
            case 'AC <- A + MBR':
                this.registers.ALU = [this.registers.A, this.registers.MBR]
                this.ALU('ADD');
                this.registers.AC = this.registers.Shifter;
                break;
            case 'MBR <- AC':
                this.registers.MBR = this.registers.AC;
                break;
            case 'M[MAR] <- MBR':
                this.memory[this.registers.MAR] = this.registers.MBR;
                break;
            case 'PC <- MAR':  
                this.registers.PC = this.registers.MAR;
                break;
            case 'PC <- (AC > 0) ? MAR : PC':
                this.registers.AC > 0 ? this.registers.PC = this.registers.MAR : this.registers.PC;
                break;
            case 'PC <- (AC === 0) ? MAR : PC':
                this.registers.AC === 0 ? this.registers.PC = this.registers.MAR : this.registers.PC;
                break;
            case 'PC <- (AC < 0) ? MAR : PC':
                this.registers.AC < 0 ? this.registers.PC = this.registers.MAR : this.registers.PC;
                break;
            case 'PC <- (AC !== 0) ? MAR : PC':
                this.registers.AC !== 0 ? this.registers.PC = this.registers.MAR : this.registers.PC;
                break;
            case 'AC <- AC - MBR':
                this.registers.AC -= this.registers.MBR;
                break;
            case 'SP <- SP - 1':
                this.registers.SP -= 1;
                break;
            case 'M[SP] <- PC':
                this.memory[this.registers.SP] = this.registers.PC;
                break;
            case 'MAR <- SP':
                this.registers.MAR = this.registers.SP;
                break;
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
                this.execMicroInst('A <- AC');        // Etapa 3: Armazena o AC em A
                this.execMicroInst('AC <- A + MBR');  // Etapa 4: Soma A e MBR e armazena em AC
                break;
            case 'SUBD':
                this.registers.IR = "0011" + addressBit;
                this.registers.MAR = address;     // Etapa 1: Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Etapa 2: Lê o valor da memória para MBR
                this.execMicroInst('AC <- AC - MBR'); // Etapa 3: Subtrai o valor de MBR de AC
                break;
            case 'JPOS': // Jump 
                this.registers.IR = "0100" + addressBit;
                this.registers.MAR = address; // Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor de memória
                this.execMicroInst('PC <- (AC > 0) ? MAR : PC');  // Se AC > 0, pula para o endereço no MAR
                break;
            case 'JZER': // Jump Zero
                this.registers.IR = "0101" + addressBit;
                this.registers.MAR = address; // Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor de memória
                this.execMicroInst('PC <- (AC === 0) ? MAR : PC');  // Se AC == 0, pula para o endereço no MAR
                break;
            case 'JUMP': // Jump
                this.registers.IR = "0110" + addressBit;
                this.registers.MAR = address; // Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor de memória
                this.execMicroInst('PC <- MAR');  // Pula para o endereço no MAR
                break;
            case 'LOCO': // Load Constant
                this.registers.IR = "0111" + addressBit;
                this.registers.MR = address; 
                this.registers.AC = address; 
                break;
            case 'LODL': // Load Local
                this.registers.IR = "1000" + addressBit;
                this.registers.MAR = address;     // Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor de memória para MBR
                this.execMicroInst('AC <- MBR');      // Carrega o valor no acumulador
                break;
            case 'STOL': // Store Local
                this.registers.IR = "1001" + addressBit;
                this.registers.MAR = address;     // Carrega o endereço no MAR
                this.execMicroInst('MBR <- AC');      // Transfere o valor do AC para o MBR
                this.execMicroInst('M[MAR] <- MBR');  // Armazena o valor no endereço
                break;
            case 'ADDL': // Add Local
                this.registers.IR = "1010" + addressBit;
                this.registers.MAR = address;     // Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor de memória para MBR
                this.execMicroInst('AC <- AC + MBR'); // Soma o valor de AC com o valor de MBR
                break;
            case 'SUBL': // Subtract Local
                this.registers.IR = "1011" + addressBit;
                this.registers.MAR = address;     // Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor de memória para MBR
                this.execMicroInst('AC <- AC - MBR'); // Subtrai o valor de MBR de AC
                break;
            case 'JNEG': // Jump Negative
                this.registers.IR = "1100" + addressBit;
                this.registers.MAR = address;     // Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor de memória para MBR
                this.execMicroInst('PC <- (AC < 0) ? MAR : PC'); // Se AC < 0, pula para o endereço no MAR
                break;
            case 'JNZE': // Jump Not Zero
                this.registers.IR = "1101" + addressBit;
                this.registers.MAR = address;     // Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor de memória para MBR
                this.execMicroInst('PC <- (AC !== 0) ? MAR : PC'); // Se AC != 0, pula para endereço no MAR
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
                this.execMicroInst('PC <- MBR');      // Transfere o valor de MBR para o PC
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
                this.execMicroInst('SP <- SP + 1');   // Incrementa o Stack Pointer
                break;
            case 'DESP': // Decrement Stack Pointer
                this.registers.IR = "11111110" + address.toString(2).padStart(8, '0');
                this.execMicroInst('SP <- SP - 1');   // Decrementa o Stack Pointer
                break;
            default:
                console.log("Instrução não suportada: ", instruction);
                break;
        }
        this.execMicroInst('PC <- PC + 1'); // Avança o contador de programa
    }
}

class SimulatorGUI {
    
    constructor(simulator, history) {
        this.simulator = simulator;
        this.history = history;
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

    loadHistory(index = 0){
        let instance = this.history.getInstance(index);
        console.log(instance);
        this.historyIndex = index;
        this.simulator.memory = instance.memory;
        this.simulator.registers = instance.registers;
    }

    navigateHistory(offset = 1){
        try {
            let instance = this.history.getInstance(this.historyIndex + offset);
            this.simulator.memory = instance.memory;
            this.simulator.registers = instance.registers;
            this.historyIndex += offset;
            this.updateMemory();
            this.updateRegisters();
        } catch (error) {
            console.log("Fora do intervalo do histórico!");
        }
    }

    runProgram(program){
        this.simulator.reset();
        history.clear();

        program.forEach((inst)=> {
            history.addInstance(this.simulator.registers, this.simulator.memory);
            this.simulator.execMacroInst(inst[0], inst[1]);
        })
        history.addInstance(this.simulator.registers, this.simulator.memory);
        this.loadHistory(0);
    }
}

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
// editDialog.showModal(); // REMOVER !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

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
