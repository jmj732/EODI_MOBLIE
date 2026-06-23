import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import {
  type ItemFormPayload,
  createItem,
  deleteItem,
  getPlaces,
  itemKeys,
  placeKeys,
  searchItems,
  updateItem,
} from "@/api/items";
import { AppButton } from "@/components/app-button";
import { InfoCard } from "@/components/info-card";
import { Screen } from "@/components/screen";
import type { ItemCategory, ItemSummary } from "@/types/item";

const CATEGORIES: ItemCategory[] = ["전자기기", "의류", "액세서리", "기타"];

type FormState = {
  name: string;
  category: ItemCategory;
  foundAt: string;
  placeId: string;
  foundPlaceDetail: string;
  reporterName: string;
  reporterStudentCode: string;
};

const defaultForm: FormState = {
  name: "",
  category: "기타",
  foundAt: "",
  placeId: "",
  foundPlaceDetail: "",
  reporterName: "",
  reporterStudentCode: "",
};

const inputStyle = {
  borderWidth: 1,
  borderColor: "#E2E8F0",
  borderRadius: 8,
  padding: 12,
  fontSize: 15,
  color: "#0F172A",
  backgroundColor: "#FFFFFF",
} as const;

function toPayload(form: FormState): ItemFormPayload {
  return {
    name: form.name,
    category: form.category,
    foundAt: form.foundAt,
    placeId: parseInt(form.placeId, 10),
    foundPlaceDetail: form.foundPlaceDetail,
    reporterName: form.reporterName || null,
    reporterStudentCode: form.reporterStudentCode ? parseInt(form.reporterStudentCode, 10) : null,
  };
}

export default function ManageScreen() {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [showPlacePicker, setShowPlacePicker] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemSummary | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  const items = useQuery({
    queryKey: itemKeys.search({ page: 1, size: 10, sort: "LATEST" }),
    queryFn: () => searchItems({ page: 1, size: 10, sort: "LATEST" }),
  });

  const places = useQuery({
    queryKey: placeKeys.all,
    queryFn: getPlaces,
  });

  const invalidateItems = () => void queryClient.invalidateQueries({ queryKey: itemKeys.all });

  const create = useMutation({
    mutationFn: (payload: ItemFormPayload) => createItem(payload),
    onSuccess: () => { invalidateItems(); closeModal(); },
    onError: () => Alert.alert("오류", "물품 등록에 실패했습니다."),
  });

  const update = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: ItemFormPayload }) =>
      updateItem(itemId, payload),
    onSuccess: () => { invalidateItems(); closeModal(); },
    onError: () => Alert.alert("오류", "물품 수정에 실패했습니다."),
  });

  const remove = useMutation({
    mutationFn: deleteItem,
    onSuccess: invalidateItems,
    onError: () => Alert.alert("오류", "물품 삭제에 실패했습니다."),
  });

  const openCreate = () => {
    setEditingItem(null);
    setForm(defaultForm);
    setModalVisible(true);
  };

  const openEdit = (item: ItemSummary) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      foundAt: item.foundAt,
      placeId: "",
      foundPlaceDetail: item.foundPlaceDetail ?? "",
      reporterName: item.reporterName ?? "",
      reporterStudentCode: item.reporterStudentCode?.toString() ?? "",
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingItem(null);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.foundAt.trim() || !form.placeId) {
      Alert.alert("입력 오류", "물품명, 발견일, 장소는 필수입니다.");
      return;
    }
    const payload = toPayload(form);
    if (editingItem) {
      update.mutate({ itemId: editingItem.id, payload });
    } else {
      create.mutate(payload);
    }
  };

  const handleDelete = (item: ItemSummary) => {
    Alert.alert("삭제 확인", `"${item.name}"을(를) 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: () => remove.mutate(item.id) },
    ]);
  };

  const selectedPlace = places.data?.find((p) => p.id.toString() === form.placeId);
  const isSaving = create.isPending || update.isPending;

  return (
    <Screen title="물품 관리" subtitle="분실물 등록, 수정, 삭제의 기준 화면입니다.">
      <AppButton title="+ 물품 등록" onPress={openCreate} />
      {items.isLoading ? <Text>불러오는 중</Text> : null}
      {items.error ? <Text selectable>물품 목록을 불러오지 못했습니다.</Text> : null}
      <View style={{ gap: 10 }}>
        {(items.data?.items ?? []).map((item) => (
          <View key={item.id} style={{ gap: 8 }}>
            <InfoCard
              title={item.name}
              value={item.status}
              detail={`${item.category} · ${item.foundAt}`}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <AppButton title="수정" variant="secondary" onPress={() => openEdit(item)} />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="삭제"
                  variant="danger"
                  onPress={() => handleDelete(item)}
                  loading={remove.isPending && remove.variables === item.id}
                />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Item form modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: "85%",
            }}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 24, gap: 16 }}
            >
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#0F172A" }}>
                {editingItem ? "물품 수정" : "물품 등록"}
              </Text>

              <TextInput
                placeholder="물품명 *"
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                style={inputStyle}
              />

              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 14, color: "#64748B" }}>카테고리 *</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setForm((f) => ({ ...f, category: cat }))}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: form.category === cat ? "#2563EB" : "#E2E8F0",
                        backgroundColor: form.category === cat ? "#EFF6FF" : "#FFFFFF",
                      }}
                    >
                      <Text style={{ color: form.category === cat ? "#2563EB" : "#475569" }}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <TextInput
                placeholder="발견일 (YYYY-MM-DD) *"
                value={form.foundAt}
                onChangeText={(v) => setForm((f) => ({ ...f, foundAt: v }))}
                style={inputStyle}
              />

              <Pressable
                onPress={() => setShowPlacePicker(true)}
                style={[inputStyle, { justifyContent: "center" }]}
              >
                <Text style={{ color: selectedPlace ? "#0F172A" : "#94A3B8", fontSize: 15 }}>
                  {selectedPlace ? selectedPlace.place : "장소 선택 *"}
                </Text>
              </Pressable>

              <TextInput
                placeholder="세부 위치"
                value={form.foundPlaceDetail}
                onChangeText={(v) => setForm((f) => ({ ...f, foundPlaceDetail: v }))}
                style={inputStyle}
              />

              <TextInput
                placeholder="신고자 이름"
                value={form.reporterName}
                onChangeText={(v) => setForm((f) => ({ ...f, reporterName: v }))}
                style={inputStyle}
              />

              <TextInput
                placeholder="신고자 학번"
                value={form.reporterStudentCode}
                onChangeText={(v) => setForm((f) => ({ ...f, reporterStudentCode: v }))}
                keyboardType="numeric"
                style={inputStyle}
              />

              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <AppButton title="취소" variant="secondary" onPress={closeModal} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppButton
                    title={editingItem ? "수정" : "등록"}
                    onPress={handleSubmit}
                    loading={isSaving}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Place picker modal */}
      <Modal visible={showPlacePicker} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: "50%",
            }}
          >
            <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#0F172A" }}>장소 선택</Text>
              {(places.data ?? []).map((place) => (
                <Pressable
                  key={place.id}
                  onPress={() => {
                    setForm((f) => ({ ...f, placeId: place.id.toString() }));
                    setShowPlacePicker(false);
                  }}
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: form.placeId === place.id.toString() ? "#2563EB" : "#E2E8F0",
                    backgroundColor:
                      form.placeId === place.id.toString() ? "#EFF6FF" : "#F8FAFC",
                  }}
                >
                  <Text style={{ color: "#0F172A" }}>{place.place}</Text>
                </Pressable>
              ))}
              <AppButton
                title="닫기"
                variant="secondary"
                onPress={() => setShowPlacePicker(false)}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
