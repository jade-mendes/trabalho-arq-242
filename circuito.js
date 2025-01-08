class Processor {
    constructor() {
        // Registradores
        this.registers = {
            PC: 0,  // Program Counter
            AC: 0,  // Accumulator
            SP: 0,  // Stack Pointer
            IR: 0,  // Memory Instruction Register
            TIR: 0, // Temporary Instruction Register
            "0": 0, // Zero
            "+1": 0, // Plus One
            "-1": 0, // Minus One
            AMASK: 0, // Adress Mask
            SMASK: 0, // Stack Mask
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
            ALatch: 0,
            BLatch: 0,
            N: 0, // Minus One
            Z: 0, // Minus One
        };

        // Memória
        this.memory = new Array(256).fill(0); 
    }
    // Unidade Lógica e Aritmética (ULA)
    ALU(op, input1, input2) {
        switch (op) {
            case 'ADD': return input1 + input2;
            case 'SUB': return input1 - input2;
            case 'AND': return input1 & input2;
            case 'OR': return input1 | input2;
            case 'NOT': return ~input1;
            case 'PASS': return input1;
            default: return 0;
        }
    }

    processInstruction() {
        // Controla a entrada esquerda da ALU
        if (this.instructions.AMUX === 0) {
            // Latch A
            for (let [r, i] of Object.entries(this.registers)) {
                if (parseInt(r) === this.instructions.A) {
                    this.registers.ALatch = this.registers[i];
                }
            }
            this.registers['ALU'][0] = this.registers.ALatch;
        } else {
            // MBR
            this.registers['ALU'][0] = this.registers.MBR;
        }

        // Coloca os conteúdos dos registradores nos barramentos B e armazena-os no latch B
        for (let [r, i] of Object.entries(this.registers)) {
            if (parseInt(r) === this.instructions.B) {
                this.registers.BLatch = this.registers[i];
            }
        }
        this.registers['ALU'][1] = this.registers.BLatch;

        // Função da ALU
        switch (this.instructions.ALU) {
            case 0:
                // A + B
                this.registers.Shifter = this.registers['ALU'][0] + this.registers['ALU'][1];
                break;
            case 1:
                // A & B
                this.registers.Shifter = this.registers['ALU'][0] & this.registers['ALU'][1];
                break;
            case 2:
                // A
                this.registers.Shifter = this.registers['ALU'][0];
                break;
            default:
                // !A
                this.registers.Shifter = ~this.registers['ALU'][0];
        }

        this.registers.N = this.registers.Shifter < 0 ? 1 : 0;
        this.registers.Z = this.registers.Shifter === 0 ? 1 : 0;

        // COND: diz se vai ocorrer um desvio ou não
        switch (this.instructions.COND) {
            case 0:
                // Não desvia
                this.registers.PC++;
                break;
            case 1:
                if (this.registers.N === 0) {
                    this.registers.PC++;
                } else {
                    this.registers.PC = this.instructions.ADDR;
                }
                break;
            case 2:
                if (this.registers.Z === 0) {
                    this.registers.PC++;
                } else {
                    this.registers.PC = this.instructions.ADDR;
                }
                break;
            default:
                this.registers.PC = this.instructions.ADDR;
        }

        // Função do deslocador
        switch (this.instructions.SH) {
            case 1:
                // Deslocamento à direita
                this.registers.Shifter >>= 1;
                break;
            case 2:
                // Deslocamento à esquerda
                this.registers.Shifter <<= 1;
                break;
        }

        // Carrega MBR a partir do deslocador
        if (this.instructions.MBR !== 0) {
            this.registers.MBR = this.registers.Shifter;
        }

        // Carrega MAR a partir do latch B
        if (this.instructions.MAR !== 0) {
            this.registers.MAR = this.registers.BLatch;
        }

        // Requisita leitura de memória
        if (this.instructions.RD !== 0) {
            this.registers.MBR = this.memory[this.registers.MAR];
        }

        // Requisita escrita na memória
        if (this.instructions.WR !== 0) {
            this.memory[this.registers.MAR] = this.registers.MBR;
        }

        // Controla armazenamento na memória de rascunho
        if (this.instructions.ENC !== 0) {
            for (let [r, i] of Object.entries(this.registers)) {
                if (parseInt(r) === this.instructions.C) {
                    this.registers[i] = this.registers.Shifter;
                }
            }
        }
    }
}
