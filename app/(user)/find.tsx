import { useInfiniteQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
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

import { searchItems } from "@/api/items";
import { normalizeImageUrl } from "@/utils/image";
import { colors, radius, shadow, typography } from "@/theme";
import type { ItemCategory, ItemSummary } from "@/types/item";

const CATEGORIES: (ItemCategory | "전체")[] = ["전체", "전자기기", "의류", "액세서리", "기타"];

export default function UserFindScreen() {
  const [inputValue, setInputValue] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } =
    useInfiniteQuery({
      queryKey: ["items", "infinite", { query: activeQuery, category: selectedCategory }] as const,
      queryFn: ({ pageParam }) =>
        searchItems({
          page: pageParam,
          size: 15,
          query: activeQuery || undefined,
          categories: selectedCategory ? [selectedCategory] : undefined,
          status: ["LOST"],
          sort: "LATEST",
        }),
      initialPageParam: 1,
      getNextPageParam: (last) => (last.isLast ? undefined : last.page + 1),
    });

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBg }}>
      {/* 검색 + 필터 헤더 */}
      <View
        style={{
          backgroundColor: colors.cardBg,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            placeholder="물품명 검색..."
            placeholderTextColor={colors.textMuted}
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={() => setActiveQuery(inputValue)}
            returnKeyType="search"
            style={{
              flex: 1,
              backgroundColor: "#F3F4F6",
              borderRadius: radius.button,
              paddingHorizontal: 14,
              paddingVertical: 10,
              fontSize: 15,
              color: colors.textMain,
            }}
          />
          <Pressable
            onPress={() => setActiveQuery(inputValue)}
            style={{
              backgroundColor: colors.primary,
              borderRadius: radius.button,
              paddingHorizontal: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 14 }}>검색</Text>
          </Pressable>
        </View>

        {/* 카테고리 필터 칩 */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(c) => c}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item: cat }) => {
            const active = cat === "전체" ? !selectedCategory : selectedCategory === cat;
            return (
              <Pressable
                onPress={() => setSelectedCategory(cat === "전체" ? null : (cat as ItemCategory))}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: radius.chip,
                  backgroundColor: active ? colors.primary : "#F3F4F6",
                }}
              >
                <Text
                  style={{
                    ...typography.caption,
                    fontWeight: "600",
                    color: active ? "#FFF" : colors.textSub,
                  }}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={() => void refetch()}
            tintColor={colors.primary}
          />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
          ) : (
            <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 40 }}>
              분실물이 없습니다.
            </Text>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} />
          ) : null
        }
        renderItem={({ item }) => <ItemCard item={item} />}
      />
    </View>
  );
}

function ItemCard({ item }: { item: ItemSummary }) {
  const imageUrl = normalizeImageUrl(item.image);
  return (
    <Pressable
      onPress={() => router.push(`/item/${item.id}`)}
      style={({ pressed }) => ({
        backgroundColor: colors.cardBg,
        borderRadius: radius.card,
        overflow: "hidden",
        opacity: pressed ? 0.9 : 1,
        ...shadow,
      })}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={{ width: "100%", height: 160 }} resizeMode="cover" />
      ) : null}
      <View style={{ padding: 14, gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <Text
            style={{ fontSize: 16, fontWeight: "600", color: colors.textMain, flex: 1 }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <View
            style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.chip, backgroundColor: colors.primaryBg }}
          >
            <Text style={{ ...typography.caption, fontWeight: "600", color: colors.primary }}>
              {item.category}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 13, color: colors.textSub }}>
          {item.foundAt}
          {item.foundPlaceDetail || item.foundPlace
            ? ` · ${item.foundPlaceDetail ?? item.foundPlace}`
            : ""}
        </Text>
      </View>
    </Pressable>
  );
}
