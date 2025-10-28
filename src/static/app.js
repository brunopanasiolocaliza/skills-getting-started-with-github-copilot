document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      // Convert to array shape used by renderActivities and populate dropdown
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = "<option value=''>-- choose activity --</option>";

      const activitiesArr = Object.entries(activities).map(([name, details]) => {
        // populate activity select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        return Object.assign({ name }, details);
      });

      renderActivities(activitiesArr);
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Render activities in the new layout
  function renderActivities(activities) {
  // Render into the visible activities list container
  const container = document.getElementById('activities-list');
    container.innerHTML = '';

    activities.forEach(activity => {
      const card = document.createElement('div');
      card.className = 'activity-card';

      const title = document.createElement('h4');
      title.className = 'activity-title';
      title.textContent = activity.name;
      card.appendChild(title);

      const desc = document.createElement('p');
      desc.className = 'activity-desc';
      desc.textContent = activity.description || '';
      card.appendChild(desc);

      const capacity = document.createElement('p');
      capacity.className = 'capacity';
      capacity.innerHTML = `Capacity: <span class="current">${activity.participants.length}</span>/<span class="max">${activity.max_participants}</span>`;
      card.appendChild(capacity);

      const participantsWrap = document.createElement('div');
      participantsWrap.className = 'participants';
      const pHeader = document.createElement('h5');
      pHeader.textContent = 'Participants';
      participantsWrap.appendChild(pHeader);

      const list = document.createElement('ul');
      list.className = 'participants-list';

      if (activity.participants && activity.participants.length) {
        activity.participants.forEach(email => {
          const li = document.createElement('li');
          li.className = 'participant-item';

          const span = document.createElement('span');
          span.className = 'participant-email';
          span.textContent = email;

          const btn = document.createElement('button');
          btn.className = 'delete-participant';
          btn.title = 'Unregister participant';
          btn.innerHTML = '🗑️';

          // Click handler to unregister participant
          btn.addEventListener('click', async () => {
            if (!confirm(`Remove ${email} from ${activity.name}?`)) return;
            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(activity.name)}/signup?email=${encodeURIComponent(email)}`,
                { method: 'DELETE' }
              );

              const body = await res.json();
              if (res.ok) {
                messageDiv.textContent = body.message;
                messageDiv.className = 'message success';
                // refresh list
                fetchActivities();
              } else {
                messageDiv.textContent = body.detail || body.message || 'Failed to remove participant';
                messageDiv.className = 'message error';
              }
              messageDiv.classList.remove('hidden');
              setTimeout(() => messageDiv.classList.add('hidden'), 4000);
            } catch (err) {
              console.error('Error removing participant:', err);
              messageDiv.textContent = 'Failed to remove participant';
              messageDiv.className = 'message error';
              messageDiv.classList.remove('hidden');
            }
          });

          li.appendChild(span);
          li.appendChild(btn);
          list.appendChild(li);
        });
      } else {
        const li = document.createElement('li');
        li.className = 'empty';
        li.textContent = 'No participants yet';
        list.appendChild(li);
      }

      participantsWrap.appendChild(list);
      card.appendChild(participantsWrap);

      // Add signup form or buttons to `card` if needed

      container.appendChild(card);
    });
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        // refresh activities to show new participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
