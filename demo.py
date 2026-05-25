def find_duplicates(arr):
    duplicates = []
    for i in range(len(arr) - 1):
        for j in range(i + 1, len(arr)):
            if arr[i] == arr[j]:
                duplicates.append(arr[i])
    return duplicates


def process_batch(data, results=[]):
    for item in data:
        if item > 0:
            results.append(item * 2)
    return results


def calculate_average(numbers):
    total = 0
    for n in numbers:
        total += n
    average = total / len(numbers)
    return average


def search_user(users, target_id):
    for i in range(len(users)):
        if users[i]["id"] == target_id:
            return users[i]
        return None