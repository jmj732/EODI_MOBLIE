import Ionicons from "@expo/vector-icons/Ionicons";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";

import { getPlaces, placeKeys, searchItems } from "@/api/items";
import { colors, radius, shadow, typography } from "@/theme";
import type { ItemCategory, ItemStatus, ItemSummary } from "@/types/item";
import { normalizeImageUrl } from "@/utils/image";

const PAGE_SIZE = 15;
const VISIBLE_STATUSES: ItemStatus[] = ["LOST", "TO_BE_DISCARDED"];

const CATEGORIES: { label: string; value: ItemCategory | null }[] = [
  { label: "전체", value: null },
  { label: "전자기기", value: "전자기기" },
  { label: "의류", value: "의류" },
  { label: "액세서리", value: "액세서리" },
  { label: "기타", value: "기타" },
];

export default function UserFindScreen() {
  const [inputValue, setInputValue] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);

  const places = useQuery({
    queryKey: placeKeys.all,
    queryFn: getPlaces,
  });

  const filters = useMemo(
    () => ({
      query: activeQuery || undefined,
      category: selectedCategory,
      placeId: selectedPlaceId,
    }),
    [activeQuery, selectedCategory, selectedPlaceId],
  );

  const itemsQuery = useInfiniteQuery({
    queryKey: ["items", "user-find", filters] as const,
    queryFn: ({ pageParam }) =>
      searchItems({
        page: pageParam,
        size: PAGE_SIZE,
        query: filters.query,
        categories: filters.category ? [filters.category] : undefined,
        placeIds: filters.placeId ? [filters.placeId] : undefined,
        status: VISIBLE_STATUSES,
        sort: "LATEST",
      }),
    initialPageParam: 1,
    getNextPageParam: (last, _pages, lastPageParam) => {
      const currentPage = typeof last.page === "number" ? last.page : lastPageParam;
      if (last.isLast || currentPage >= last.totalPages || last.content.length < PAGE_SIZE) return undefined;
      return lastPageParam + 1;
    },
  });

  const items = itemsQuery.data?.pages.flatMap((page) => page.content) ?? [];
  const hasAnyFilter = !!activeQuery || !!selectedCategory || !!selectedPlaceId;
  const totalCount = itemsQuery.data?.pages[0]?.totalElements ?? 0;

  const applySearch = () => {
    setActiveQuery(inputValue.trim());
  };

  const clearFilters = () => {
    setInputValue("");
    setActiveQuery("");
    setSelectedCategory(null);
    setSelectedPlaceId(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBg }}>
      <View
        style={{
          gap: 12,
          padding: 16,
          paddingBottom: 12,
          backgroundColor: colors.appBg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ gap: 5 }}>
          <Text style={{ ...typography.h1, color: colors.textMain }}>분실물 찾기</Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textSub }}>
            이름, 종류, 장소로 보관 중인 물품을 빠르게 찾으세요.
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: colors.cardBg,
            borderRadius: 14,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="search" color={colors.textMuted} size={19} />
          <TextInput
            placeholder="물품명 검색"
            placeholderTextColor={colors.textMuted}
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={applySearch}
            returnKeyType="search"
            style={{
              flex: 1,
              minHeight: 48,
              fontSize: 15,
              color: colors.textMain,
            }}
          />
          {inputValue ? (
            <Pressable onPress={() => setInputValue("")} hitSlop={8}>
              <Ionicons name="close-circle" color={colors.textMuted} size={18} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={applySearch}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 10,
              backgroundColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "800", color: "#FFFFFF" }}>검색</Text>
          </Pressable>
        </View>

        <FilterSection title="종류">
          <FlatList
            horizontal
            data={CATEGORIES}
            keyExtractor={(item) => item.label}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <FilterChip
                label={item.label}
                active={selectedCategory === item.value}
                onPress={() => setSelectedCategory(item.value)}
              />
            )}
          />
        </FilterSection>

        <FilterSection
          title="장소"
          trailing={places.isLoading ? "불러오는 중" : places.isError ? "장소 불러오기 실패" : undefined}
        >
          <FlatList
            horizontal
            data={[{ id: 0, name: "전체" }, ...(places.data ?? [])]}
            keyExtractor={(item) => String(item.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <FilterChip
                label={item.name}
                active={item.id === 0 ? selectedPlaceId === null : selectedPlaceId === item.id}
                onPress={() => setSelectedPlaceId(item.id === 0 ? null : item.id)}
              />
            )}
          />
        </FilterSection>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSub }}>총 {totalCount}개</Text>
          {hasAnyFilter ? (
            <Pressable onPress={clearFilters} hitSlop={8}>
              <Text style={{ fontSize: 13, fontWeight: "800", color: colors.primary }}>필터 초기화</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={itemsQuery.isRefetching && !itemsQuery.isLoading}
            onRefresh={() => void itemsQuery.refetch()}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState loading={itemsQuery.isLoading} error={itemsQuery.isError} hasFilter={hasAnyFilter} />
        }
        ListFooterComponent={
          itemsQuery.isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
          ) : null
        }
        onEndReached={() => {
          if (itemsQuery.hasNextPage && !itemsQuery.isFetchingNextPage) void itemsQuery.fetchNextPage();
        }}
        onEndReachedThreshold={0.45}
        renderItem={({ item }) => <ItemCard item={item} />}
      />
    </View>
  );
}

function FilterSection({ title, trailing, children }: { title: string; trailing?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 13, fontWeight: "800", color: colors.textMain }}>{title}</Text>
        {trailing ? <Text style={{ fontSize: 12, color: colors.textMuted }}>{trailing}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderRadius: radius.chip,
        backgroundColor: active ? colors.primary : colors.cardBg,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "700", color: active ? "#FFFFFF" : colors.textSub }}>{label}</Text>
    </Pressable>
  );
}

function EmptyState({ loading, error, hasFilter }: { loading: boolean; error: boolean; hasFilter: boolean }) {
  if (loading) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />;
  }

  return (
    <View
      style={{
        marginTop: 28,
        padding: 22,
        borderRadius: radius.card,
        backgroundColor: colors.cardBg,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        gap: 8,
      }}
    >
      <Ionicons name={error ? "alert-circle-outline" : "file-tray-outline"} color={colors.textMuted} size={28} />
      <Text style={{ fontSize: 15, fontWeight: "800", color: colors.textMain }}>
        {error ? "목록을 불러오지 못했습니다" : hasFilter ? "조건에 맞는 분실물이 없습니다" : "보관 중인 분실물이 없습니다"}
      </Text>
      <Text style={{ fontSize: 13, lineHeight: 19, color: colors.textSub, textAlign: "center" }}>
        {error ? "네트워크 상태나 서버 주소를 확인해주세요." : "검색어 또는 필터를 바꿔 다시 확인해보세요."}
      </Text>
    </View>
  );
}

function ItemCard({ item }: { item: ItemSummary }) {
  const imageUrl = normalizeImageUrl(item.image);

  return (
    <Pressable
      onPress={() => router.push(`/item/${item.id}`)}
      style={({ pressed }) => ({
        flexDirection: "row",
        minHeight: 116,
        backgroundColor: colors.cardBg,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
        opacity: pressed ? 0.9 : 1,
        ...shadow,
      })}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={{ width: 112, height: "100%" }} resizeMode="cover" />
      ) : (
        <View
          style={{
            width: 112,
            backgroundColor: "#EEF2F7",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="image-outline" color={colors.textMuted} size={24} />
        </View>
      )}
      <View style={{ flex: 1, padding: 13, gap: 7 }}>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
          <Text style={{ flex: 1, fontSize: 16, fontWeight: "800", color: colors.textMain }} numberOfLines={2}>
            {item.name}
          </Text>
          <StatusPill status={item.status} />
        </View>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>{item.category}</Text>
        <Text style={{ fontSize: 13, color: colors.textSub }} numberOfLines={1}>
          {item.foundPlace ?? "장소 미상"}
          {item.foundPlaceDetail ? ` · ${item.foundPlaceDetail}` : ""}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>{item.foundAt}</Text>
      </View>
    </Pressable>
  );
}

function StatusPill({ status }: { status: ItemStatus }) {
  const isDisposal = status === "TO_BE_DISCARDED";
  return (
    <View
      style={{
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: radius.chip,
        backgroundColor: isDisposal ? colors.warningBg : colors.accentBg,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: "800", color: isDisposal ? colors.warning : colors.accent }}>
        {isDisposal ? "폐기 예정" : "보관중"}
      </Text>
    </View>
  );
}
