import { RuleHandler } from './interface';
import { AddToListRule } from './handlers/addToList';

// We map the database rule "type" string to its matching RuleHandler class
export const RuleHandlers: Record<string, RuleHandler> = {
    'add_to_list': new AddToListRule(),
    // Future plugins:
    // 'js_challenge': new JsChallengeRule(),
    // 'block_asn': new BlockAsnRule(),
};
