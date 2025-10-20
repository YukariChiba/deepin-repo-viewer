<template>
    <v-app>
        <v-main>
            <v-app-bar scroll-behavior="hide">
                <v-app-bar-title>
                    <v-icon start icon="mdi-archive-eye" />
                    Repo Viewer
                </v-app-bar-title>
                <v-select
                    v-model="api_selected"
                    clearable
                    label="1. Select API..."
                    :items="Object.keys(apis)"
                    hide-details
                >
                    <template #item="{ props: itemProps, item }">
                        <v-list-item
                            v-bind="itemProps"
                            :title="getApi(item.raw).title"
                            :subtitle="getApi(item.raw).url"
                        />
                    </template>
                </v-select>
                <v-select
                    v-model="repo_selected"
                    clearable
                    label="2. Select repository..."
                    :disabled="Object.keys(repos).length == 0"
                    :items="Object.keys(repos)"
                    hide-details
                >
                    <template #item="{ props: itemProps, item }">
                        <v-list-item
                            v-bind="itemProps"
                            :subtitle="repos[item.raw]?.url"
                        />
                    </template>
                </v-select>
                <v-select
                    v-model="dist_selected"
                    clearable
                    :disabled="!repo_selected"
                    label="3. Select distribution..."
                    :items="repo_selected ? repos[repo_selected]?.dists : []"
                    hide-details
                />
            </v-app-bar>
            <NuxtPage />
            <v-snackbar-queue v-model="snackbar.queue" />
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import apis_data from "@/assets/apis.json";
import { ref } from "vue";
import type { APIs, Repositories } from "@/utils/api";

const apis: APIs = apis_data;
const api_selected = ref();

const repos: Ref<Repositories> = ref({});

const snackbar = useSnackbarStore();

const updateIndex = async () => {
    navigate();
    repos.value = {};
    repo_selected.value = null;
    dist_selected.value = null;
    if (!api_selected.value) return;
    try {
        const data: Repositories = await fetchIndexRemote(
            getApi(api_selected.value).url,
        );
        repos.value = data;
    } catch {
        console.log("error");
        snackbar.add({
            text: `API ${api_selected.value} Unreachable`,
            color: "error",
        });
    }
};
onMounted(updateIndex);

watch(api_selected, updateIndex);

const repo_selected: Ref<string | null> = ref(null);
const dist_selected: Ref<string | null> = ref(null);

const router = useRouter();

const navigate = () => {
    if (api_selected.value && repo_selected.value && dist_selected.value) {
        router.push({
            query: {
                api: api_selected.value,
                repo: repo_selected.value,
                dist: dist_selected.value.replace("/", "-"),
            },
        });
    } else {
        router.push({});
    }
};

watch(dist_selected, navigate);
watch(repo_selected, () => {
    dist_selected.value = null;
});
</script>
