import { Reference } from "../reference/reference.mjs";
import { ReferenceId } from "../reference/referenceId.mjs";
import { MemberEventSubscriptionStack } from "../stack/member-event-subscription-stack.mjs";
import { MemberEvent } from "./member-event.mjs";
const privateBag = new WeakMap();
export class MemberEventSubscription extends Reference {
    /**
     * @param {ReferenceId} memberEventRefId
     * @param {ReferenceId} memberEventSubscriptionStackRefId
     */
    constructor(memberEventRefId, memberEventSubscriptionStackRefId) {
        super(`${memberEventRefId.name}_subscription`);
        super.addReference(memberEventRefId, MemberEvent.prototype);
        super.addReference(memberEventSubscriptionStackRefId, MemberEventSubscriptionStack.prototype);
    }
    async callback(data) {
        const memberEvent = super.getReference(MemberEvent.prototype);
        const { callback } = privateBag.get(this);
        memberEvent.data = await callback(data);
    }
    /**
     * @param { Promise<MemberEvent> } callback
     */
    async subscribe(callback) {
        privateBag.set(this, { callback });
        const memberEventSubscriptionStack = super.getReference(MemberEventSubscriptionStack.prototype);
        memberEventSubscriptionStack.unshift(super.Id);
    }
}