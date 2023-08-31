import { MemberEvent } from "../event/member-event.mjs";
import { Reference } from "../reference/reference.mjs";
import { ReferenceId } from "../reference/referenceId.mjs";
export class MemberEventCallStack extends Reference {
    constructor() {
        super('membereventcallstack');
    }
    /**
     * @returns {Boolean}
     */
    isValid = () => {
        const topOfStackEvent = super.getReference(MemberEvent.prototype);
        throw new Error('Not Implemented');
        for (const { Id } of topOfStackEvent.memberInfo.membersInfo) {
            if (this.memberEvents.find(me => me.memberInfo.Id === Id)) {
                return true;
            }
        }
        return false;
    }
    /**
     * @returns {MemberEvent}
     */
    shift() {
        return super.shiftStack(MemberEvent.prototype);
    }
    reset() {
        return super.resetStack(MemberEvent.prototype);
    }
    /**
    * @param {ReferenceId} memberEventRefId
    */
    unshift(memberEventRefId) {
        super.addReference(memberEventRefId, MemberEvent.prototype);
    }
}