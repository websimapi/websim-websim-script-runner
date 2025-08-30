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
    projectTitle: async () => (await getProject())?.title ?? 'Untitled Project',
    projectDescription: async () => (await getProject())?.description ?? '',
    creatorUsername: async () => (await getCreator())?.username ?? 'Unknown Creator',
};

export async function getData(key) {
    if (dataFetchers[key]) {
        return await dataFetchers[key]();
    }
    console.warn(`Data key not found: ${key}`);
    return null;
}

