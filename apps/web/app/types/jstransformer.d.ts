declare module 'jstransformer' {
    export * from '@tensorflow/tfjs-node';
    export class TFAutoTokenizer {
        static from_pretrained(model: string): Promise<AutoTokenizer>;
        eos_token_id: number;
        decode(ids: number[], options: { skip_special_tokens: boolean }): string;
    }

    export class TFAutoModelForCausalLM {
        static from_pretrained(model: string): Promise<TFAutoModelForCausalLM>;
        generate(input_ids: any, options: object): Promise<any>;
    }
}
