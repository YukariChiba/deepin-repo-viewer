<template>
    <v-app>
        <v-main>
            <v-app-bar>
                <v-app-bar-title>Repo Viewer</v-app-bar-title>
                <v-select
                    v-model="repo_selected"
                    label="Select repository..."
                    :items="Object.keys(repos)"
                    hide-details
                >
                    <template #item="{ props: itemProps, item }">
                        <v-list-item
                            v-bind="itemProps"
                            :subtitle="repos[item.raw].url"
                        />
                    </template>
                </v-select>
                <v-select
                    v-model="dist_selected"
                    :disabled="!repo_selected"
                    label="Select distribution..."
                    :items="repo_selected ? repos[repo_selected].dists : []"
                    hide-details
                />
            </v-app-bar>
            <NuxtPage />
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
const repos = reactive({});

onMounted(async () => {
    const data = await fetchIndexRemote();
    Object.assign(repos, data);
});

const repo_selected: Ref<string | null> = ref(null);
const dist_selected: Ref<string | null> = ref(null);

const router = useRouter();

const navigate = () => {
    if (repo_selected.value && dist_selected.value) {
        router.push({
            query: {
                repo: repo_selected.value,
                dist: dist_selected.value.replace("/", "-"),
            },
        });
    }
};

watch(dist_selected, navigate);
watch(repo_selected, () => {
    dist_selected.value = null;
});
</script>
