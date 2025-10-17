<template>
    <v-card v-if="!check_blank()" flat class="my-2 mx-4">
        <v-card-title class="d-flex align-center">
            {{ `${route.query.repo} | ${route.query.dist}` }}
            <v-spacer class="mx-1" />
            <v-checkbox
                class="mx-4"
                hide-details
                label="Version Mismatch"
                @click="setextra('data.meta.version_mismatch')"
            />
            <v-text-field
                v-model="search"
                label="Search"
                clearable
                variant="outlined"
                hide-details
                single-line
                density="compact"
            />
        </v-card-title>
        <v-divider />
        <v-data-table-server
            :items-length="totalitems"
            :loading="loading"
            :headers="headers"
            :items="items"
            :search="search"
            :items-per-page-options="[20, 50, 100, 500, 1000]"
            :items-per-page="itemsperpage"
            @update:options="onOptionChanged"
        >
            <template #[`item.source`]="{ item }">
                {{ item.source }}
                <v-btn
                    v-if="item.data.github"
                    end
                    icon="mdi-github"
                    flat
                    size="small"
                    :href="`https://github.com/deepin-community/${item.source}`"
                />
            </template>
            <template #[`item.component`]="{ item }">
                <v-chip :text="item.component" size="small" />
            </template>
            <template #[`item.data1`]="{ item }">
                <v-chip
                    v-if="item.data.source"
                    :text="item.data.source"
                    size="small"
                />
                <v-chip v-else text="Unknown" size="small" />
            </template>
            <template #[`item.data2`]="{ item }">
                <template
                    v-for="arch in Object.keys(item.data.binary || {})"
                    :key="arch"
                >
                    <v-tooltip>
                        <template v-slot:activator="{ props }">
                            <v-chip
                                v-bind="props"
                                :color="
                                    check_mismatch(item, arch) ? 'warning' : ''
                                "
                                class="mr-1"
                                :text="`${arch} | ${Object.keys(item.data.binary[arch]).length}`"
                                size="small"
                            />
                        </template>
                        <template
                            v-for="[pkg, data] of Object.entries(
                                item.data.binary[arch],
                            )"
                            :key="pkg"
                        >
                            {{ pkg }}:
                            <v-chip
                                :text="data"
                                size="x-small"
                                :color="
                                    data != item.data.source && item.data.source
                                        ? 'warning'
                                        : ''
                                "
                            />
                            <br />
                        </template>
                    </v-tooltip>
                </template>
            </template>
        </v-data-table-server>
    </v-card>
    <v-empty-state
        v-else
        headline="Welcome!"
        title="Select a repository to continue..."
        icon="mdi-magnify"
    />
</template>

<script lang="ts" setup>
import type { RouteLocationNormalizedLoadedGeneric } from "vue-router";

const items = ref([]);
const search = ref("");
const totalitems = ref(0);

const loading = ref(false);
const itemsperpage = ref(50);
const curpage = ref(1);

const route = useRoute();

const extraflags: Ref<{ [key: string]: string }> = ref({});

const setextra = async (str: string, content: string | null = null) => {
    if (content) {
        extraflags.value[str] = content;
    } else {
        if (str in Object.keys(extraflags)) {
            extraflags.value[str] =
                extraflags.value[str] === "true" ? "false" : "true";
        } else {
            extraflags.value[str] = "true";
        }
    }

    await fetchdata();
};

const check_mismatch = (it, arch) => {
    return ((it.data.meta || {}).version_mismatch || {})[arch];
};

const check_blank = (r: RouteLocationNormalizedLoadedGeneric | null = null) => {
    return !(r || route).query.repo || !(r || route).query.dist;
};

const onOptionChanged = async ({ page, itemsPerPage }) => {
    curpage.value = page;
    itemsperpage.value = itemsPerPage;
    await fetchdata();
};

const fetchdata = async (
    r: RouteLocationNormalizedLoadedGeneric | null = null,
) => {
    if (check_blank(r)) return;
    items.value.splice(0, items.value.length);
    loading.value = true;
    const api_id = (r || route).query.api?.toString() || "public";
    const res = await fetchDataRemote(
        getApi(api_id).url,
        r || route,
        curpage.value,
        itemsperpage.value,
        search.value,
        extraflags.value,
    );
    items.value.splice(0, items.value.length, ...res.data);
    totalitems.value = res.items;
    loading.value = false;
};

onBeforeRouteUpdate(fetchdata);

const headers = [
    { title: "Source Name", value: "source" },
    { title: "Component", value: "component" },
    { title: "Source Version", value: "data1" },
    { title: "Package Versions", value: "data2" },
];
</script>
