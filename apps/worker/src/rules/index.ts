import { RuleHandler } from './interface';
import { AddIpToListRule } from './handlers/addIpToList';

// We map the database rule "type" string to its matching RuleHandler class
export const RuleHandlers: Record<string, RuleHandler> = {
    'add_ip_to_list': new AddIpToListRule(),
    // Future plugins:
    // 'js_challenge': new JsChallengeRule(),
    // 'block_asn': new BlockAsnRule(),
};
