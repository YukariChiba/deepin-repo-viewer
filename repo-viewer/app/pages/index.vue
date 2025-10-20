<template>
    <v-card v-if="!check_blank()" flat class="my-2 mx-4">
        <v-card-title class="d-flex align-center">
            {{ `${route.query.repo} | ${route.query.dist}` }}
            <v-spacer class="mx-1" />
            <v-autocomplete
                v-model="option_filter"
                :items="filter_items"
                prepend-inner-icon="mdi-filter-outline"
                class="mx-2"
                label="Filters"
                chips
                hide-details
                variant="outlined"
                single-line
                density="compact"
                multiple
                clearable
            />
            <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                class="mx-2"
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
                        <template #activator="{ props }">
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
        :text="`${new Date().getFullYear()} &copy; deepin-ports SIG`"
    />
</template>

<script lang="ts" setup>
import type { RouteLocationNormalizedLoadedGeneric } from "vue-router";
import { ExtraQuery } from "@/utils/query";

const items = ref([]);
const search = ref("");
const totalitems = ref(0);

const loading = ref(false);
const itemsperpage = ref(50);
const curpage = ref(1);

const route = useRoute();

const option_filter = ref([]);

const extraflags: ExtraQuery = new ExtraQuery();

const check_mismatch = (it, arch: string) => {
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
        extraflags,
    );
    items.value.splice(0, items.value.length, ...res.data);
    totalitems.value = res.items;
    loading.value = false;
};

watch(option_filter, async (d: string[]) => {
    extraflags.clearKey();
    for (const i of d) extraflags.setKeyBool(i, true);
    await fetchdata();
});
onBeforeRouteUpdate(fetchdata);

const headers = [
    { title: "Source Name", value: "source" },
    { title: "Component", value: "component" },
    { title: "Source Version", value: "data1" },
    { title: "Package Versions", value: "data2" },
];

const filter_items = [
    { type: "subheader", title: "Metadata" },
    {
        title: "Version Mismatched",
        value: "data.meta.version_mismatch",
    },
    {
        title: "GitHub Repository Available",
        value: "data.github",
    },
    { type: "subheader", title: "Architecture" },
    {
        title: "Arch: amd64",
        value: "data.binary.amd64",
    },
    {
        title: "Arch: arm64",
        value: "data.binary.arm64",
    },
    {
        title: "Arch: riscv64",
        value: "data.binary.riscv64",
    },
    {
        title: "Arch: loong64",
        value: "data.binary.loong64",
    },
    {
        title: "Arch: i386",
        value: "data.binary.i386",
    },
    {
        title: "Arch: all",
        value: "data.binary.all",
    },
];
</script>
