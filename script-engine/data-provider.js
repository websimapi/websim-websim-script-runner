let projectCache = null;
let creatorCache = null;

async function getProject() {
    if (projectCache === null) {
        projectCache = await window.websim.getCurrentProject();
    }
    return projectCache;
}

async function getCreator() {
    if (creatorCache === null) {
        creatorCache = await window.websim.getCreator();
    }
    return creatorCache;
}

const dataFetchers = {
    project_title: async () => (await getProject())?.title ?? 'Untitled Project',
    project_description: async () => (await getProject())?.description ?? '',
    creator_username: async () => (await getCreator())?.username ?? 'Unknown Creator',
    creator_avatar_url: async () => {
        const creator = await getCreator();
        return creator?.username ? `https://images.websim.com/avatar/${creator.username}` : '';
    },
    creator_profile: async () => {
        const creator = await getCreator();
        const username = creator?.username ?? 'Unknown';
        return {
            text: username,
            href: `https://websim.com/@${username}`
        };
    },
};

export async function getData(key) {
    if (dataFetchers[key]) {
        return await dataFetchers[key]();
    }
    console.warn(`Data key not found: ${key}`);
    return null;
}

