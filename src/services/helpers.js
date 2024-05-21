import { useTeamsStore } from '../stores/teams-store.js';

// Converts an epoch timestamp to a localized date and time string.
const epochStringToDate = (timestamp) => {
    return new Date(parseInt(timestamp)).toLocaleString('sv-SE',
        {
            dateStyle: 'short',
            timeStyle: 'short',
            timeZone: 'Europe/Stockholm'
        });
}

// Returns a concatenated string of the conversation's title, create date, and all messages
const exportConversation = (id) => {
    const teamsStore = useTeamsStore();

    let conversation = teamsStore.getConversation(id);
    let info = teamsStore.getConversationInfo(id);
    const setHeading = (message) => message.role == 'user' ? '## ' : '';
    const getContent = (message) => 'content' in message ? message.content : '<image not exported>';;

    return `# ${info.title}\n` +
        `${epochStringToDate(info.created)}\n\n` +
        conversation.map(message => `${setHeading(message)}${getContent(message)}`).join("\n\n");
}

// Public functions
export {
    exportConversation
};
