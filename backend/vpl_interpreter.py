
"""
VPL Interpreter: Executes a VPL policy JSON with real condition checking and ticket raising.
Compatible with the new schema: each block has id, type, label/value, inputs, and output info.
"""
import json
from typing import Any, Dict, List

class VPLInterpreter:
    def __init__(self, policy_json: Any):
        if isinstance(policy_json, str):
            self.policy = json.loads(policy_json)
        else:
            self.policy = policy_json
        # Support both {blocks: [...]} and {vplBlocks: [...]} for compatibility
        self.blocks = {}
        for block in self.policy.get('blocks', []) + self.policy.get('vplBlocks', []):
            self.blocks[block['id']] = block
        self._eval_cache = {}

    def run(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Run the policy with the provided context (e.g., usage, cost).
        Returns a list of output actions (tickets, notifications, logs).
        """
        self._eval_cache = {}
        outputs = []
        # Find all output blocks
        for block in self.blocks.values():
            if block['type'] == 'output':
                # Evaluate the input to the output block
                if block.get('inputs') and self._eval_block(block['inputs'][0], context):
                    outputs.append({
                        'outputType': block.get('outputType', 'ticket'),
                        'outputData': block.get('outputData', {})
                    })
        return outputs

    def _eval_block(self, block_id: str, context: Dict[str, Any]):
        if block_id in self._eval_cache:
            return self._eval_cache[block_id]
        block = self.blocks[block_id]
        t = block['type']
        # Input blocks: fetch from context
        if t == 'input':
            val = context.get(block.get('label'))
        # Const blocks: use value
        elif t == 'const':
            val = block.get('value')
        # Arithmetic
        elif t == 'add':
            val = sum(self._eval_block(i, context) for i in block.get('inputs', []))
        elif t == 'subtract':
            ins = block.get('inputs', [])
            val = self._eval_block(ins[0], context) - self._eval_block(ins[1], context)
        elif t == 'multiply':
            prod = 1
            for i in block.get('inputs', []):
                prod *= self._eval_block(i, context)
            val = prod
        elif t == 'divide':
            ins = block.get('inputs', [])
            denom = self._eval_block(ins[1], context)
            val = self._eval_block(ins[0], context) / denom if denom != 0 else None
        # Decisions
        elif t in ('lt', 'less_than'):
            ins = block.get('inputs', [])
            val = self._eval_block(ins[0], context) < self._eval_block(ins[1], context)
        elif t in ('gt', 'greater_than'):
            ins = block.get('inputs', [])
            val = self._eval_block(ins[0], context) > self._eval_block(ins[1], context)
        elif t in ('eq', 'equals'):
            ins = block.get('inputs', [])
            val = self._eval_block(ins[0], context) == self._eval_block(ins[1], context)
        elif t == 'and':
            val = all(self._eval_block(i, context) for i in block.get('inputs', []))
        elif t == 'or':
            val = any(self._eval_block(i, context) for i in block.get('inputs', []))
        else:
            val = None
        self._eval_cache[block_id] = val
        return val

# Example usage (remove or adapt for integration):
if __name__ == "__main__":
    with open("example_policy.json") as f:
        policy_json = json.load(f)
    interpreter = VPLInterpreter(policy_json)
    # Example: context with current usage and cost
    outputs = interpreter.run({"Usage %": 15, "Daily Cost": 250})
    for out in outputs:
        print(f"[OUTPUT] {out['outputType']}: {out['outputData']}")
